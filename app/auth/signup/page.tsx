"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <main className="max-w-sm mx-auto px-6 py-24">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
          Interview Prep
        </p>
        <h1 className="text-2xl font-light text-gray-900 tracking-tight mb-4">
          Check your email
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-24">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
        Interview Prep
      </p>
      <h1 className="text-2xl font-light text-gray-900 tracking-tight mb-10">
        Create account
      </h1>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full py-3.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-25 transition-all"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-gray-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}