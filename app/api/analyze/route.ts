import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PrepData } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert career coach and technical recruiter.
The user will paste a raw job description. Analyze it and return ONLY a valid JSON object.
No markdown, no backticks, no preamble, no explanation. Nothing before or after the JSON.

The JSON must strictly follow this structure:

{
  "summary": "3-sentence summary of the role and its context",
  "keywords": ["keyword1", "keyword2"],
  "location": "City and country extracted from the job description, or null if not mentioned",
  "website": "Company website URL if mentioned in the job description, or null",
  "company": {
    "name": "Company name if mentioned, else null",
    "summary": "2-sentence summary of the company and team."
  },
  "expectations": "What they expect from the candidate in exactly 3 sentences",
  "technicalQuestions": ["Q1", "Q2", "Q3", "Q4", "Q5"],
  "behavioralQuestions": ["Q1", "Q2", "Q3"],
  "questionsToAsk": ["Q1", "Q2", "Q3"],
  "cvWeaknesses": [
    { "weakness": "...", "howToAddress": "..." },
    { "weakness": "...", "howToAddress": "..." },
    { "weakness": "...", "howToAddress": "..." }
  ]
}

Rules:
- Never use em dashes in your responses. Use commas or rewrite the sentence instead.
- technicalQuestions must be specific to the tech stack and domain mentioned
- behavioralQuestions must use STAR method framing
- questionsToAsk must signal strategic thinking, not just curiosity
- cvWeaknesses are plausible gaps for this role profile (you do not have the actual CV)
- Always respond in English regardless of the job description language`;

export async function POST(req: NextRequest) {
  try {
    const { jobDescription } = await req.json();

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description too short" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: jobDescription }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const data: PrepData = JSON.parse(cleaned);

    // Sauvegarde dans Supabase si user connecté
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("prep_history").insert({
          user_id: user.id,
          company_name: data.company.name ?? "Unknown company",
          job_description: jobDescription,
          prep_data: data,
        });
      }
    } catch (dbError) {
      console.error("Failed to save to history:", dbError);
      // On ne bloque pas si la sauvegarde échoue
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze job description" },
      { status: 500 }
    );
  }
}