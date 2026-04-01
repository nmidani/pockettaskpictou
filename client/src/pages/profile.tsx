import { useAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { useGetMyProfile, useUpdateMyProfile, getGetMyProfileQueryKey } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Loader2, Star, CheckCircle2, AlertTriangle, Shield, Phone, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TOWNS = ["New Glasgow", "Stellarton", "Trenton", "Westville", "Pictou", "River John", "Abercrombie", "Scotsburn"];
const REPORT_REASONS = ["Did not show up", "Scam", "Harassment", "Unsafe task", "Other"];

function StarDisplay({ rating }: { rating: number | null | undefined }) {
  const val = rating ?? 0;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${val >= i ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function TrustBadge({ score, isFlagged }: { score: number; isFlagged: boolean }) {
  const color =
    isFlagged ? "text-red-600 bg-red-50 border-red-200" :
    score >= 70 ? "text-green-700 bg-green-50 border-green-200" :
    score >= 40 ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-gray-600 bg-gray-50 border-gray-200";

  const label =
    isFlagged ? "Flagged" :
    score >= 70 ? "Trusted" :
    score >= 40 ? "Building" :
    "New";

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${color}`}>
      <Shield className="w-3.5 h-3.5" />
      🔥 Trust Score: {score}% — {label}
    </div>
  );
}

function TrustBreakdown({ score, tasksCompleted, rating, isFlagged }:
  { score: number; tasksCompleted: number; rating: number | null | undefined; isFlagged: boolean }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">How trust is calculated</p>
        <span className="text-lg font-extrabold text-[#1B2A4A]">{score}<span className="text-sm font-normal text-gray-400">/100</span></span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${isFlagged ? "bg-red-500" : score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-400" : "bg-gray-400"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="text-center">
          <p className="text-xs font-bold text-[#1B2A4A]">+{Math.min(tasksCompleted * 5, 50)}</p>
          <p className="text-[10px] text-gray-400">✔ Completions</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-[#1B2A4A]">+{Math.round((rating ?? 0) * 10)}</p>
          <p className="text-[10px] text-gray-400">⭐ Rating</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-red-500">−reports</p>
          <p className="text-[10px] text-gray-400">🚩 Reports</p>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 text-center pt-1">Higher trust score → higher priority in task assignments</p>
    </div>
  );
}

function PhoneVerification({ phone, isVerified, onVerified }: {
  phone: string | null | undefined;
  isVerified: boolean;
  onVerified: () => void;
}) {
  const [step, setStep] = useState<"idle" | "sending" | "entering" | "verifying">("idle");
  const [newPhone, setNewPhone] = useState(phone ?? "");
  const [code, setCode] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFlow, setShowFlow] = useState(false);

  async function sendCode() {
    if (!newPhone.trim()) { setError("Please enter a phone number first."); return; }
    setStep("sending");
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/phone/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: newPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setStep("idle"); return; }
      setSimulatedCode(data.simulatedCode ?? null);
      setStep("entering");
    } catch {
      setError("Network error. Try again.");
      setStep("idle");
    }
  }

  async function verifyCode() {
    if (!code.trim()) { setError("Please enter the code."); return; }
    setStep("verifying");
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/phone/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setStep("entering"); return; }
      setShowFlow(false);
      setStep("idle");
      onVerified();
    } catch {
      setError("Network error. Try again.");
      setStep("entering");
    }
  }

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 font-semibold bg-green-50 border border-green-200 rounded-xl px-3 py-2">
        <BadgeCheck className="w-4 h-4" />Phone verified
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <Phone className="w-4 h-4" />Phone not verified
        <button onClick={() => setShowFlow((v) => !v)} className="ml-auto text-xs underline text-[#1B2A4A]">
          {showFlow ? "Cancel" : "Verify now"}
        </button>
      </div>

      {showFlow && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          {step === "idle" || step === "sending" ? (
            <>
              <p className="text-xs text-gray-500">Enter your phone number to receive a verification code.</p>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 902-555-0100"
                type="tel"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button onClick={sendCode} disabled={step === "sending"} size="sm" className="w-full rounded-xl bg-[#1B2A4A] text-white font-bold">
                {step === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Code"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">Enter the 6-digit code sent to <strong>{newPhone}</strong>.</p>
              {simulatedCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700">
                  <strong>Demo mode:</strong> Your code is <strong className="font-mono text-base">{simulatedCode}</strong>
                </div>
              )}
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("idle")} size="sm" className="flex-1 rounded-xl text-xs">Back</Button>
                <Button onClick={verifyCode} disabled={step === "verifying"} size="sm" className="flex-1 rounded-xl bg-[#F5A623] text-white font-bold text-xs">
                  {step === "verifying" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, refetch } = useGetMyProfile();
  const { mutateAsync: updateProfile } = useUpdateMyProfile();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ratings, setRatings] = useState<{ rating: number; review?: string | null; createdAt: string }[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);

  const [form, setForm] = useState({ role: "", town: "", bio: "", phone: "", firstName: "", lastName: "" });

  const needsOnboarding = !profile?.role || !profile?.town;

  useEffect(() => {
    if (profile) {
      setForm({
        role: (profile as any).role ?? "",
        town: (profile as any).town ?? TOWNS[0],
        bio: profile.bio ?? "",
        phone: profile.phone ?? "",
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
      });
      if (needsOnboarding) setEditing(true);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/api/ratings/${user.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRatings(d.ratings ?? []))
      .catch(() => {});
  }, [user?.id]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ data: { role: form.role, town: form.town, bio: form.bio || null, phone: form.phone || null, firstName: form.firstName || null, lastName: form.lastName || null } });
      queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleReport() {
    await fetch(`${API_BASE}/api/reports`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ targetType: "user", targetId: user?.id, reason: reportReason, details: null }),
    });
    setReportDone(true);
    setReportOpen(false);
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#1B2A4A]" />
    </div>
  );

  const displayName = form.firstName ? `${form.firstName} ${form.lastName}`.trim() : user?.username ?? "Anonymous";
  const initials = (form.firstName?.[0] ?? user?.username?.[0] ?? "?").toUpperCase();
  const trustScore = (profile as any)?.trustScore ?? 0;
  const isFlagged = (profile as any)?.isFlagged ?? false;
  const isPhoneVerified = (profile as any)?.isPhoneVerified ?? false;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />Profile saved!
        </div>
      )}

      {/* Flagged warning */}
      {isFlagged && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Account Flagged</p>
            <p className="text-xs text-red-600 mt-0.5">Your account has received multiple reports. If your behaviour continues, your account may be suspended. Please review our <Link href="/guidelines" className="underline font-semibold">Community Guidelines</Link>.</p>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-[#1B2A4A]/20">
            <AvatarImage src={user?.profileImage ?? undefined} />
            <AvatarFallback className="bg-[#1B2A4A]/10 text-[#1B2A4A] text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-[#1B2A4A]">{displayName}</h2>
            <p className="text-sm text-gray-500">@{user?.username}</p>
            {(profile as any)?.role && (
              <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${(profile as any).role === "task_giver" ? "bg-[#1B2A4A]/10 text-[#1B2A4A]" : "bg-[#F5A623]/15 text-[#F5A623]"}`}>
                {(profile as any).role === "task_giver" ? "Task Giver" : "Task Taker"}
              </span>
            )}
          </div>
        </div>

        {/* Trust badge */}
        <div className="mb-4">
          <TrustBadge score={trustScore} isFlagged={isFlagged} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center bg-gray-50 rounded-xl py-3">
            <p className="text-lg font-extrabold text-[#1B2A4A]">{profile?.tasksPosted ?? 0}</p>
            <p className="text-[10px] text-gray-500 font-medium">Posted</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl py-3">
            <p className="text-lg font-extrabold text-[#1B2A4A]">{profile?.tasksCompleted ?? 0}</p>
            <p className="text-[10px] text-gray-500 font-medium">✔ Done</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl py-3">
            <p className="text-lg font-extrabold text-[#F5A623]">{profile?.rating ? profile.rating.toFixed(1) : "—"}</p>
            <p className="text-[10px] text-gray-500 font-medium">⭐ Rating</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl py-3">
            <p className={`text-lg font-extrabold ${trustScore >= 70 ? "text-green-600" : trustScore >= 40 ? "text-amber-500" : "text-gray-500"}`}>{trustScore}</p>
            <p className="text-[10px] text-gray-500 font-medium">🔥 Trust</p>
          </div>
        </div>

        {(profile as any)?.town && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
            📍 {(profile as any).town}
          </p>
        )}
        {profile?.bio && <p className="text-sm text-gray-600 leading-relaxed mb-3">{profile.bio}</p>}

        <div className="flex gap-2 mt-2">
          <Button onClick={() => setEditing(!editing)} variant="outline" size="sm" className="rounded-xl text-xs font-bold flex-1">
            {editing ? "Cancel Edit" : "Edit Profile"}
          </Button>
          <Button onClick={logout} variant="ghost" size="sm" className="rounded-xl text-xs text-gray-500 hover:text-red-500">
            Log out
          </Button>
        </div>
      </div>

      {/* Trust score breakdown */}
      <TrustBreakdown
        score={trustScore}
        tasksCompleted={profile?.tasksCompleted ?? 0}
        rating={profile?.rating}
        isFlagged={isFlagged}
      />

      {/* Phone verification */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-bold text-[#1B2A4A] mb-3 text-sm">Phone Verification</h3>
        <PhoneVerification
          phone={profile?.phone}
          isVerified={isPhoneVerified}
          onVerified={() => {
            queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
            refetch();
          }}
        />
        <p className="text-[10px] text-gray-400 mt-2">Verifying your phone helps build trust with task givers and takers.</p>
      </div>

      {/* Onboarding / Edit form */}
      {(needsOnboarding || editing) && (
        <div className="bg-white rounded-2xl border border-[#F5A623]/30 p-5 shadow-sm">
          {needsOnboarding && (
            <div className="mb-4">
              <h3 className="font-bold text-[#1B2A4A] text-lg">Complete Your Profile</h3>
              <p className="text-sm text-gray-500">Set up your account to start posting or claiming tasks.</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">I want to…</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm((f) => ({ ...f, role: "task_giver" }))}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all text-center ${form.role === "task_giver" ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white border-gray-200 text-gray-600"}`}>
                  📋 Post Tasks<br /><span className="text-xs font-normal opacity-70">I'm a Task Giver</span>
                </button>
                <button type="button" onClick={() => setForm((f) => ({ ...f, role: "task_taker" }))}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all text-center ${form.role === "task_taker" ? "bg-[#F5A623] text-white border-[#F5A623]" : "bg-white border-gray-200 text-gray-600"}`}>
                  💰 Earn Money<br /><span className="text-xs font-normal opacity-70">I'm a Task Taker</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">First Name</label>
                <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Jane" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Last Name</label>
                <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Smith" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Your Town</label>
              <select value={form.town} onChange={(e) => setForm((f) => ({ ...f, town: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20">
                {TOWNS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 902-555-0100" type="tel"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Short Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell neighbours a bit about yourself…" rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20" />
            </div>

            <Button onClick={handleSave} disabled={saving || !form.role} className="w-full h-11 rounded-2xl bg-[#F5A623] hover:bg-[#F5A623]/90 text-white font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : needsOnboarding ? "Get Started →" : "Save Profile"}
            </Button>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-bold text-[#1B2A4A] mb-1">
          Reviews {ratings.length > 0 && <span className="text-gray-400 font-normal text-sm">({ratings.length})</span>}
        </h3>
        {profile?.rating && <StarDisplay rating={profile.rating} />}
        <div className="mt-4 space-y-3">
          {ratings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Complete a task to earn your first one.</p>
          ) : (
            ratings.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <StarDisplay rating={r.rating} />
                {r.review && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.review}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-center">
        <p className="text-xs text-blue-700 font-medium">
          Users are ranked based on reliability, fairness, and recent activity.
        </p>
      </div>

      <div className="text-center space-y-2 pb-4">
        <Link href="/guidelines" className="block text-sm text-[#1B2A4A] font-semibold hover:underline">Community Guidelines</Link>
        {!reportDone ? (
          <button onClick={() => setReportOpen(true)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 mx-auto">
            <AlertTriangle className="w-3 h-3" />Report this profile
          </button>
        ) : (
          <p className="text-xs text-gray-400">Report submitted. Thank you.</p>
        )}
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-4">Report Profile</h3>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20">
              {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReportOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleReport} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold">Submit Report</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
