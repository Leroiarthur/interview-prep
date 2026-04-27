"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AccountPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserEmail(user.email ?? null);
      setLoading(false);
    };
    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleChangeEmail = async () => {
    setEmailError(null);
    setEmailSuccess(false);
    if (!newEmail || !newEmail.includes("@")) { setEmailError("Please enter a valid email address."); return; }
    if (newEmail === userEmail) { setEmailError("This is already your current email."); return; }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );
    if (error) { setEmailError(error.message); }
    else { setEmailSuccess(true); setNewEmail(""); setShowEmailInput(false); }
    setEmailLoading(false);
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);
    if (!currentPassword) { setPwError("Please enter your current password."); return; }
    if (newPassword.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    setPwLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail!, password: currentPassword });
    if (signInError) { setPwError("Current password is incorrect."); setPwLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPwError(error.message); }
    else { setPwSuccess(true); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    setPwLoading(false);
  };

  const handleDeleteAccount = async () => {
    const res = await fetch('/api/delete-account', { method: 'DELETE' });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push('/auth/login');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  const inputClass = "w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-300";

  return (
    <div className="min-h-screen">
      <Navbar showBack backHref="/" backLabel="Interview Prep" />

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Settings</p>
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">Account</h1>
        </div>

        <div className="border-b border-gray-100 pb-10">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Email</p>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-700">{userEmail}</p>
            <button
              onClick={() => { setShowEmailInput(!showEmailInput); setEmailError(null); setEmailSuccess(false); }}
              className="text-gray-300 hover:text-gray-500 transition-colors"
              title="Change email"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
          {showEmailInput && (
            <div className="mt-4 space-y-3">
              <input
                autoFocus
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                placeholder="New email address"
              />
              {emailError && <p className="text-xs text-red-400">{emailError}</p>}
              {emailSuccess && <p className="text-xs text-gray-500">Confirmation sent to both emails. Click both links to confirm.</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowEmailInput(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                <button onClick={handleChangeEmail} disabled={emailLoading} className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-25">
                  {emailLoading ? "Sending..." : "Confirm change →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-100 pb-10">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Change password</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Current password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">New password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Repeat new password" />
            </div>
            {pwError && <p className="text-xs text-red-400">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-green-500">Password updated successfully.</p>}
            <button onClick={handleChangePassword} disabled={pwLoading} className="w-full py-3.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-25 transition-all">
              {pwLoading ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>

        <div className="pb-10 space-y-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Session</p>
          <button onClick={handleSignOut} className="block text-sm text-gray-500 hover:text-gray-800 transition-colors underline underline-offset-2">
            Sign out of this device
          </button>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} className="block text-sm text-red-400 hover:text-red-600 transition-colors underline underline-offset-2">
              Delete my account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 space-y-3">
              <p className="text-sm text-red-600 font-medium">Are you sure? This cannot be undone.</p>
              <p className="text-xs text-red-400">All your data, history and profile will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleDeleteAccount} className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all">Yes, delete</button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
