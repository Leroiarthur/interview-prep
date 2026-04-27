import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { question, answer, questionType } = await req.json();
    if (!question || !answer) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `You are an expert interview coach evaluating a candidate's answer.
Return ONLY a valid JSON object, no markdown, no backticks.

{
  "score": <number from 1 to 10>,
  "scoreLabel": <"Weak" | "Average" | "Good" | "Excellent">,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "tip": "One concise actionable tip to immediately improve this answer"
}

Rules:
- Be honest but constructive
- For behavioral questions, check if the STAR method was used
- score 1-4 = Weak, 5-6 = Average, 7-8 = Good, 9-10 = Excellent
- Keep each strength and improvement under 15 words
- Always respond in the same language as the answer`,
      messages: [{ role: "user", content: `Question type: ${questionType}\nQuestion: ${question}\nCandidate answer: ${answer}` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const feedback = JSON.parse(cleaned);

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("practice_answers").insert({
          user_id: user.id,
          question,
          question_type: questionType,
          answer,
          score: feedback.score,
          score_label: feedback.scoreLabel,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          tip: feedback.tip,
        });
      }
    } catch (dbErr) {
      console.error("Failed to save answer:", dbErr);
    }

    return NextResponse.json(feedback);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}
