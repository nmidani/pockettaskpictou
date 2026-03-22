import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Loader2, Trash2, ShieldOff, ShieldCheck, BarChart2, ListTodo, Users, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  totalUsers: number;
}

interface AdminTask {
  id: number;
  title: string;
  status: string;
  pay: number;
  town: string | null;
  category: string;
  createdAt: string;
  postedById: string;
  posterEmail: string | null;
  posterFirstName: string | null;
  posterLastName: string | null;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  suspended: boolean;
  createdAt: string;
  rating: number | null;
  reportsCount: number | null;
  tasksCompleted: number | null;
  trustScore: number | null;
}

interface AdminReport {
  id: number;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporterEmail: string | null;
  reporterFirstName: string | null;
  reporterLastName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayName(firstName: string | null, lastName: string | null, email: string | null) {
  if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(" ");
  return email ?? "Unknown";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  claimed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-[#1B2A4A]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = "stats" | "tasks" | "users" | "reports";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "stats", label: "Stats", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "tasks", label: "Tasks", icon: <ListTodo className="w-4 h-4" /> },
  { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { id: "reports", label: "Reports", icon: <Flag className="w-4 h-4" /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("stats");

  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [authLoading, user, setLocation]);

  const fetchTab = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === "stats") {
        const r = await fetch("/api/admin/stats", { credentials: "include" });
        if (!r.ok) throw new Error("Failed");
        setStats(await r.json());
      } else if (t === "tasks") {
        const r = await fetch("/api/admin/tasks", { credentials: "include" });
        if (!r.ok) throw new Error("Failed");
        setTasks(await r.json());
      } else if (t === "users") {
        const r = await fetch("/api/admin/users", { credentials: "include" });
        if (!r.ok) throw new Error("Failed");
        setUsers(await r.json());
      } else if (t === "reports") {
        const r = await fetch("/api/admin/reports", { credentials: "include" });
        if (!r.ok) throw new Error("Failed");
        setReports(await r.json());
      }
    } catch {
      setError("Could not load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchTab(tab);
    }
  }, [tab, authLoading, user, fetchTab]);

  async function deleteTask(id: number) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await fetch(`/api/admin/tasks/${id}`, { method: "DELETE", credentials: "include" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function toggleSuspend(userId: string) {
    const r = await fetch(`/api/admin/users/${userId}/suspend`, { method: "POST", credentials: "include" });
    if (!r.ok) return;
    const { suspended } = await r.json();
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, suspended } : u)));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B2A4A]" />
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-[#F5A623]" />
          <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Admin Panel</h1>
        </div>
        <p className="text-sm text-gray-500">Manage tasks, users, and reports for PocketTask.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-white text-[#1B2A4A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {/* ── Stats ── */}
      {!loading && tab === "stats" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Tasks" value={stats.totalTasks} />
            <StatCard label="Active Tasks" value={stats.activeTasks} sub="open / claimed / in progress" />
            <StatCard label="Completed" value={stats.completedTasks} />
            <StatCard label="Cancelled" value={stats.cancelledTasks} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.totalUsers} />
          </div>
        </div>
      )}

      {/* ── Tasks ── */}
      {!loading && tab === "tasks" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No tasks yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.category} · {task.town ?? "—"} · ${task.pay} · {fmtDate(task.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400">
                      By {displayName(task.posterFirstName, task.posterLastName, task.posterEmail)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {task.status.replace("_", " ")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Users ── */}
      {!loading && tab === "users" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-700">{users.length} user{users.length !== 1 ? "s" : ""}</p>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No users yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {displayName(u.firstName, u.lastName, u.email)}
                      </p>
                      {u.role === "admin" && (
                        <span className="text-[10px] font-bold bg-[#F5A623] text-white px-1.5 py-0.5 rounded-full">Admin</span>
                      )}
                      {u.suspended && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Suspended</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {u.email ?? u.id} · Joined {fmtDate(u.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Rating: {u.rating != null ? u.rating.toFixed(1) : "—"} ·
                      Reports: {u.reportsCount ?? 0} ·
                      Completed: {u.tasksCompleted ?? 0} ·
                      Trust: {u.trustScore ?? 0}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSuspend(u.id)}
                    className={`shrink-0 h-8 px-3 text-xs font-semibold ${
                      u.suspended
                        ? "text-green-600 hover:bg-green-50"
                        : "text-red-500 hover:bg-red-50"
                    }`}
                  >
                    {u.suspended ? (
                      <><ShieldCheck className="w-3.5 h-3.5 mr-1" />Unsuspend</>
                    ) : (
                      <><ShieldOff className="w-3.5 h-3.5 mr-1" />Suspend</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reports ── */}
      {!loading && tab === "reports" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-700">{reports.length} report{reports.length !== 1 ? "s" : ""}</p>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No reports filed yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((r) => (
                <div key={r.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.targetType === "user" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                      {r.targetType}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{r.reason}</p>
                      {r.details && <p className="text-xs text-gray-500 mt-0.5">{r.details}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Target ID: {r.targetId} · By {displayName(r.reporterFirstName, r.reporterLastName, r.reporterEmail)} · {fmtDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
