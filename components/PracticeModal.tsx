"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Question = { text: string; type: string; };
type Feedback = { score: number; scoreLabel: string; strengths: string[]; improvements: string[]; tip: string; };
type PastAnswer = { id: string; answer: string; score: number; score_label: string; strengths: string[]; improvements: string[]; tip: string; created_at: string; };

type Props = { questions: Question[]; startIndex: number; onClose: () => void; };

export default function PracticeModal({ questions, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pastAnswers, setPastAnswers] = useState<PastAnswer[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [answeredIndexes, setAnsweredIndexes] = useState<Set<number>>(new Set());

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const supabase = createClient();

  useEffect(() => {
    const checkAnswered = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("practice_answers")
        .select("question")
        .eq("user_id", user.id);
      if (data) {
        const answered = new Set<number>();
        questions.forEach((q, i) => {
          if (data.some((a) => a.question === q.text)) answered.add(i);
        });
        setAnsweredIndexes(answered);
      }
    };
    checkAnswered();
  }, []);

  useEffect(() => {
    setAnswer("");
    setFeedback(null);
    setError(null);
    setShowHistory(false);
    setPastAnswers([]);
  }, [index]);

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setHistoryLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("practice_answers")
        .select("*")
        .eq("user_id", user.id)
        .eq("question", current.text)
        .order("created_at", { ascending: false });
      setPastAnswers(data ?? []);
    }
    setHistoryLoading(false);
    setShowHistory(true);
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: current.text, answer, questionType: current.type }),
      });
      if (!res.ok) throw new Error();
      const fb = await res.json();
      setFeedback(fb);
      setAnsweredIndexes(new Set([...answeredIndexes, index]));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => { setIndex(index + 1); };

  const scoreColor = (score: number) => {
    if (score >= 9) return "text-green-600";
    if (score >= 7) return "text-blue-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-500";
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-gray-400">Practice</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center transition-colors ${
                    i === index
                      ? "bg-gray-900 text-white"
                      : answeredIndexes.has(i)
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {answeredIndexes.has(i) && i !== index ? "✓" : i + 1}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors text-lg leading-none">×</button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{current.type}</p>
              <p className="text-base font-light text-gray-900 leading-relaxed">{current.text}</p>
            </div>
            <button
              onClick={loadHistory}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${showHistory ? "border-gray-900 text-gray-900" : "border-gray-200 text-gray-400 hover:border-gray-400"}`}
            >
              {historyLoading ? "..." : showHistory ? "Hide history" : `History${answeredIndexes.has(index) ? " ✓" : ""}`}
            </button>
          </div>

          {showHistory && (
            <div className="mb-6 space-y-3">
              {pastAnswers.length === 0 ? (
                <p className="text-xs text-gray-400">No past answers for this question yet.</p>
              ) : (
                pastAnswers.map((pa) => (
                  <div key={pa.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${scoreColor(pa.score)}`}>{pa.score}/10 — {pa.score_label}</span>
                      <span className="text-xs text-gray-400">{formatDate(pa.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{pa.answer}</p>
                    {pa.tip && <p className="text-xs text-gray-400 italic">→ {pa.tip}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {!feedback ? (
            <div className="space-y-4">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-40 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-300 leading-relaxed"
                placeholder="Type your answer here..."
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading || !answer.trim()}
                className="w-full py-3.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-25 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Evaluating...
                  </span>
                ) : "Get feedback"}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className={`text-4xl font-light ${scoreColor(feedback.score)}`}>{feedback.score}<span className="text-lg">/10</span></span>
                <span className={`text-sm font-medium ${scoreColor(feedback.score)}`}>{feedback.scoreLabel}</span>
              </div>

              {feedback.strengths.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Strengths</p>
                  <ul className="space-y-1.5">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">To improve</p>
                  <ul className="space-y-1.5">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-orange-400 mt-0.5">→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Tip</p>
                <p className="text-sm text-gray-600 leading-relaxed">{feedback.tip}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setFeedback(null)} className="flex-1 py-3 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
                  Try again
                </button>
                {!isLast ? (
                  <button onClick={handleNext} className="flex-1 py-3 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-all">
                    Next →
                  </button>
                ) : (
                  <button onClick={onClose} className="flex-1 py-3 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-all">
                    Finish ✓
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
