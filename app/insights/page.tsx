"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Insights = {
  empty: boolean;
  stats?: {
    total: number;
    avgOverall: number;
    avgTechnical: number | null;
    avgBehavioral: number | null;
    technicalCount: number;
    behavioralCount: number;
  };
  weakest?: { question: string; score: number; tip: string }[];
  progression?: { date: string; avg: number }[];
  ai?: {
    profile: string;
    topStrengths: string[];
    recurringThemes: string[];
    blindSpots: string[];
    cvAdvice: string;
    nextFocus: string;
  };
};

const STORAGE_KEY = "interview_prep_insights";

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [answerCount, setAnswerCount] = useState<number>(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { count } = await supabase
        .from("practice_answers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setAnswerCount(count ?? 0);

      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const { data, generatedAt } = JSON.parse(cached);
          setInsights(data);
          setLastGenerated(generatedAt);
        } catch {}
      }

      setCheckingAuth(false);
    };
    init();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInsights(data);
      const generatedAt = new Date().toISOString();
      setLastGenerated(generatedAt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, generatedAt }));
    } catch {
      setError("Failed to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const scoreColor = (score: number) => {
    if (score >= 9) return "text-green-600";
    if (score >= 7) return "text-blue-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-500";
  };

  const scoreBar = (score: number) => {
    const color = score >= 9 ? "bg-green-400" : score >= 7 ? "bg-blue-400" : score >= 5 ? "bg-yellow-400" : "bg-red-400";
    return (
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
    );
  };

  if (checkingAuth) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar showBack backHref="/" backLabel="Interview Prep" />

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-12">

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Your journey</p>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Insights</h1>
            {lastGenerated && (
              <p className="text-xs text-gray-400 mt-1">Last generated {formatDate(lastGenerated)}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading || answerCount === 0}
              className="px-4 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : insights ? "Regenerate" : "Generate insights"}
            </button>
            {answerCount === 0 && (
              <p className="text-xs text-gray-400">No practice data yet</p>
            )}
            {answerCount > 0 && (
              <p className="text-xs text-gray-400">{answerCount} answer{answerCount > 1 ? "s" : ""} to analyze</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!insights && !loading && (
          <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center space-y-3">
            <p className="text-sm text-gray-500">
              {answerCount === 0
                ? "Practice some questions first to unlock your insights."
                : "Click Generate insights to analyze your practice history."}
            </p>
            {answerCount === 0 && (
              <Link href="/" className="inline-block text-sm text-gray-700 underline underline-offset-2">
                Generate a prep sheet
              </Link>
            )}
          </div>
        )}

        {insights && !insights.empty && insights.stats && insights.ai && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Answers</p>
                <p className="text-3xl font-light text-gray-900">{insights.stats.total}</p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Technical</p>
                <p className={`text-3xl font-light ${insights.stats.avgTechnical ? scoreColor(insights.stats.avgTechnical) : "text-gray-300"}`}>
                  {insights.stats.avgTechnical ?? "—"}
                </p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Behavioral</p>
                <p className={`text-3xl font-light ${insights.stats.avgBehavioral ? scoreColor(insights.stats.avgBehavioral) : "text-gray-300"}`}>
                  {insights.stats.avgBehavioral ?? "—"}
                </p>
              </div>
            </div>

            <Section label="Your profile">
              <p className="text-sm leading-relaxed text-gray-600">{insights.ai.profile}</p>
            </Section>

            <Section label="Top strengths">
              <ul className="space-y-2">
                {insights.ai.topStrengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>{s}
                  </li>
                ))}
              </ul>
            </Section>

            <Section label="Recurring themes">
              <div className="flex flex-wrap gap-2">
                {insights.ai.recurringThemes.map((t, i) => (
                  <span key={i} className="text-xs border border-gray-200 rounded-full px-3 py-1.5 text-gray-600">{t}</span>
                ))}
              </div>
            </Section>

            <Section label="Blind spots">
              <ul className="space-y-2">
                {insights.ai.blindSpots.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-orange-400">→</span>{b}
                  </li>
                ))}
              </ul>
            </Section>

            {insights.weakest && insights.weakest.length > 0 && (
              <Section label="Questions to revisit">
                <div className="space-y-4">
                  {insights.weakest.map((w, i) => (
                    <div key={i} className="border-l-2 border-gray-100 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${scoreColor(w.score)}`}>{w.score}/10</span>
                        {scoreBar(w.score)}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{w.question}</p>
                      {w.tip && <p className="text-xs text-gray-400 italic">→ {w.tip}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {insights.progression && insights.progression.length > 1 && (
              <Section label="Progression">
                <div className="space-y-2">
                  {insights.progression.map((p, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-xs text-gray-400 w-24 shrink-0">{p.date}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${p.avg >= 7 ? "bg-blue-400" : p.avg >= 5 ? "bg-yellow-400" : "bg-red-400"}`}
                          style={{ width: `${(p.avg / 10) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-8 text-right ${scoreColor(p.avg)}`}>{p.avg}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div className="grid grid-cols-1 gap-4 pb-12">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">CV advice</p>
                <p className="text-sm text-gray-600 leading-relaxed">{insights.ai.cvAdvice}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Focus next on</p>
                <p className="text-sm text-white leading-relaxed">{insights.ai.nextFocus}</p>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-10">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">{label}</p>
      {children}
    </div>
  );
}
