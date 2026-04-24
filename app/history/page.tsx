"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PrepData } from "@/lib/types";
import PrepCard from "@/components/PrepCard";
import Link from "next/link";

type HistoryEntry = {
  id: string;
  company_name: string;
  created_at: string;
  prep_data: PrepData;
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data } = await supabase
        .from("prep_history")
        .select("id, company_name, created_at, prep_data")
        .order("created_at", { ascending: false });

      setEntries(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
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
          <Link href="/" className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors">
            ← Interview Prep
          </Link>
          <span className="text-xs text-gray-400">History</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-10">
          {selected ? selected.company_name : "History"}
        </h1>

        {selected ? (
          <div>
            <button
              onClick={() => setSelected(null)}
              className="mb-8 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Back to history
            </button>
            <PrepCard data={selected.prep_data} />
          </div>
        ) : (
          <div>
            {entries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-gray-400 mb-4">No analyses yet.</p>
                <Link
                  href="/"
                  className="text-sm text-gray-700 underline underline-offset-2"
                >
                  Generate your first prep sheet
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="w-full flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 px-2 rounded-lg transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {entry.company_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(entry.created_at)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}