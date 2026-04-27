import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: answers } = await supabase
      .from("practice_answers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!answers || answers.length === 0) {
      return NextResponse.json({ empty: true });
    }

    const technicalAnswers = answers.filter((a) => a.question_type === "Technical");
    const behavioralAnswers = answers.filter((a) => a.question_type === "Behavioral");

    const avg = (arr: any[]) => arr.length ? Math.round(arr.reduce((s, a) => s + a.score, 0) / arr.length * 10) / 10 : null;

    const weakest = [...answers]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((a) => ({ question: a.question, score: a.score, tip: a.tip }));

    const byWeek: Record<string, number[]> = {};
    answers.forEach((a) => {
      const week = new Date(a.created_at).toISOString().slice(0, 10);
      if (!byWeek[week]) byWeek[week] = [];
      byWeek[week].push(a.score);
    });
    const progression = Object.entries(byWeek).map(([date, scores]) => ({
      date,
      avg: Math.round(scores.reduce((s, n) => s + n, 0) / scores.length * 10) / 10,
    }));

    const answersText = answers.slice(-20).map((a) =>
      `Q: ${a.question}\nA: ${a.answer}\nScore: ${a.score}/10\nStrengths: ${a.strengths.join(", ")}\nImprovements: ${a.improvements.join(", ")}`
    ).join("\n\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `You are a career coach analyzing a candidate's interview practice history.
Return ONLY a valid JSON object, no markdown, no backticks.

{
  "profile": "3-sentence professional profile of this candidate based on their answers and patterns",
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "recurringThemes": ["theme 1", "theme 2", "theme 3"],
  "blindSpots": ["blindspot 1", "blindspot 2"],
  "cvAdvice": "One specific piece of advice to improve their CV based on patterns in their answers",
  "nextFocus": "The single most important thing they should work on next"
}

Be specific and insightful. Identify patterns across multiple answers.`,
      messages: [{ role: "user", content: `Here are the candidate's practice answers:\n\n${answersText}` }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const aiInsights = JSON.parse(cleaned);

    return NextResponse.json({
      empty: false,
      stats: {
        total: answers.length,
        avgTechnical: avg(technicalAnswers),
        avgBehavioral: avg(behavioralAnswers),
        avgOverall: avg(answers),
        technicalCount: technicalAnswers.length,
        behavioralCount: behavioralAnswers.length,
      },
      weakest,
      progression,
      ai: aiInsights,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
