"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PrepData } from "@/lib/types";
import PrepCard from "@/components/PrepCard";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [prepData, setPrepData] = useState<PrepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); }
      else { setUserEmail(user.email ?? null); setCheckingAuth(false); }
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      if (!res.ok) throw new Error("Server error");
      const data: PrepData = await res.json();
      setPrepData(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrepData(null);
    setJobDescription("");
    setError(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-gray-400">Interview Prep</span>
          <div className="flex items-center gap-6">
            <a href="/history" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">History</a>
            <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
            <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">
            {prepData?.company?.name ?? "Prep Generator"}
          </h1>
          {prepData && (
            <button onClick={handleReset} className="mt-3 text-sm text-gray-400 hover:text-gray-700 transition-colors">
              ← New analysis
            </button>
          )}
        </div>
        {!prepData && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-700 mb-1">How it works</p>
              <p className="text-sm text-gray-400 leading-relaxed">Paste the full text of a job posting below. You will receive a structured prep sheet with a summary, keywords, likely interview questions, and tailored advice.</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Job description</label>
              <textarea
                className="w-full h-64 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-300 leading-relaxed"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-gray-300">
                {jobDescription.length < 50 ? `${50 - jobDescription.length} more characters needed` : `${jobDescription.length} characters`}
              </p>
              {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || jobDescription.trim().length < 50}
              className="w-full py-3.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : ("Generate prep sheet")}
            </button>
          </div>
        )}
        {prepData && <PrepCard data={prepData} />}
      </main>
    </div>
  );
}
