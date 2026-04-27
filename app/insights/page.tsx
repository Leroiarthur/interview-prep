"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      try {
        const res = await fetch("/api/insights");
        if (!res.ok) throw new Error();
        setInsights(await res.json());
      } catch {
        setError("Failed to load insights.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 9) return "text-green-600";
    if (score >= 7) return "text-blue-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-500";
  };

  const scoreBar = (score: number) => {
    const pct = (score / 10) * 100;
    const color = score >= 9 ? "bg-green-400" : score >= 7 ? "bg-blue-400" : score >= 5 ? "bg-yellow-400" : "bg-red-400";
    return (
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400">Analyzing your practice history...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors">← Interview Prep</Link>
          <div className="flex items-center gap-6">
            <Link href="/history" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">History</Link>
            <Link href="/profile" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Profile</Link>
            <Link href="/account" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Account</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-12">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Your journey</p>
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">Insights</h1>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {insights?.empty && (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-gray-500">No practice data yet.</p>
            <p className="text-xs text-gray-400">Generate a prep sheet and start answering questions to see your insights.</p>
            <Link href="/" className="inline-block mt-4 text-sm text-gray-700 underline underline-offset-2">Generate a prep sheet</Link>
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
                <p className="text-xs uppercase tracking-widest text-gr-400 mb-1">Behavioral</p>
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

            <div className="grid grid-cols-1 gap-4">
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
