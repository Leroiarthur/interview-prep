"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PrepData } from "@/lib/types";
import PrepCard from "@/components/PrepCard";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [jobDescription, setJobDescription] = useState("");
  const [prepData, setPrepData] = useState<PrepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();
        if (!profile?.onboarding_completed) { router.push("/onboarding"); return; }
        setUser(user);
        setUserEmail(user.email ?? null);
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPrepData(null);
    setJobDescription("");
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

  if (checkingAuth) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LandingPage />;

  return (
    <div className="min-h-screen">
<Navbar onSignOut={handleSignOut} />
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
              ) : "Generate prep sheet"}
            </button>
          </div>
        )}
        {prepData && <PrepCard data={prepData} />}
      </main>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">

      <nav className="px-6 py-5 flex items-center justify-between max-w-4xl mx-auto w-full">
        <span className="text-xs uppercase tracking-widest text-gray-400">Interview Prep</span>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Sign in</Link>
          <Link href="/auth/signup" className="text-xs font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">Get started</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-2xl mx-auto w-full">

        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">AI-powered interview preparation</p>

        <h1 className="text-5xl font-light text-gray-900 tracking-tight leading-tight mb-6">
          Walk into every<br />interview ready.
        </h1>

        <p className="text-base text-gray-400 leading-relaxed mb-12 max-w-md">
          Paste a job description. Get a structured prep sheet with likely questions, company insights, and tailored advice. Practice your answers and track your progress over time.
        </p>

        <Link
          href="/auth/signup"
          className="px-8 py-4 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-all"
        >
          Start preparing for free
        </Link>

        <p className="text-xs text-gray-300 mt-4">No credit card required.</p>

      </main>

      <div className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Prep sheet</p>
            <p className="text-sm text-gray-500 leading-relaxed">Summary, keywords, and company insights generated from any job posting.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Practice</p>
            <p className="text-sm text-gray-500 leading-relaxed">Answer likely questions and get instant AI feedback with a score and tips.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Insights</p>
            <p className="text-sm text-gray-500 leading-relaxed">Track your progress and discover your strengths over time.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
