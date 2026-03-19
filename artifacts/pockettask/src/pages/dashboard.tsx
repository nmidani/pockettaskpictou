import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetTasks, useGetMyPostedTasks, useGetMyApplications } from "@workspace/api-client-react";
import { Task } from "@workspace/api-client-react";
import { PlusCircle, MapPin, Clock, Banknote, Smartphone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["All", "Yard Work", "Cleaning", "Moving Help", "Dog Walking", "Grocery Pickup", "Tech Help", "Small Repairs", "Other"];
const TOWNS = ["All Towns", "New Glasgow", "Stellarton", "Trenton", "Westville", "Pictou", "River John", "Abercrombie", "Scotsburn"];

type Toast = { id: number; message: string; type: "success" | "error" };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function show(message: string, type: Toast["type"] = "success") {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }
  return { toasts, show };
}

function statusBadge(status: string) {
  if (status === "open") return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Open</span>;
  if (status === "claimed") return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Taken</span>;
  if (status === "completed") return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Completed</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{status}</span>;
}

function TaskCard({ task, userId, onClaimed }: { task: Task; userId?: string; onClaimed: (id: number) => void }) {
  const [claiming, setClaiming] = useState(false);
  const isOwn = task.postedById === userId;
  const canClaim = task.status === "open" && !isOwn && !!userId;

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/claim`, { method: "POST", credentials: "include" });
      if (res.status === 409) {
        onClaimed(-task.id); // negative = error
      } else if (res.ok) {
        onClaimed(task.id);
      }
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider">{task.category}</span>
            {statusBadge(task.status)}
          </div>
          <Link href={`/tasks/${task.id}`}>
            <h3 className="font-bold text-[#1B2A4A] text-base leading-snug hover:underline cursor-pointer line-clamp-1">{task.title}</h3>
          </Link>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xl font-extrabold text-green-600">${task.pay}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
        {task.town && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.town}</span>}
        {task.estimatedHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.estimatedHours}h</span>}
        <span className="flex items-center gap-1">
          {task.paymentMethod === "etransfer" ? <Smartphone className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
          {task.paymentMethod === "etransfer" ? "eTransfer" : "Cash"}
        </span>
      </div>
      <div className="flex gap-2">
        <Link href={`/tasks/${task.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold">View Details</Button>
        </Link>
        {canClaim && (
          <Button size="sm" onClick={handleClaim} disabled={claiming}
            className="flex-1 rounded-xl text-xs font-bold bg-[#F5A623] hover:bg-[#F5A623]/90 text-white">
            {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : "Claim Task"}
          </Button>
        )}
        {isOwn && (
          <span className="flex items-center text-xs text-gray-400 px-2">Your task</span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, login } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"browse" | "activity">("browse");
  const [category, setCategory] = useState("All");
  const [town, setTown] = useState("All Towns");
  const { toasts, show: showToast } = useToast();
  const [claimedIds, setClaimedIds] = useState<Set<number>>(new Set());

  const { data: tasksData, isLoading, refetch } = useGetTasks({
    ...(category !== "All" ? { category } : {}),
    ...(town !== "All Towns" ? { town } : {}),
  });

  const { data: myTasksData } = useGetMyPostedTasks();
  const { data: myAppsData } = useGetMyApplications();

  function handleClaimed(id: number) {
    if (id < 0) {
      showToast("This task has already been taken.", "error");
    } else {
      showToast("Task claimed! Head to the task page to chat.", "success");
      setClaimedIds((s) => new Set([...s, id]));
      refetch();
      setTimeout(() => setLocation(`/tasks/${id}`), 1200);
    }
  }

  const tasks = tasksData?.tasks ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Toasts */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 pointer-events-none animate-in slide-in-from-right ${t.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
            {t.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B2A4A]">
            {user?.firstName ? `Hi, ${user.firstName}!` : "Dashboard"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Find work or manage your tasks.</p>
        </div>
        <Link href="/post-task">
          <Button className="rounded-2xl bg-[#F5A623] hover:bg-[#F5A623]/90 text-white font-bold shadow-md shadow-[#F5A623]/20 gap-1.5">
            <PlusCircle className="w-4 h-4" />Post Task
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5">
        {(["browse", "activity"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? "bg-white text-[#1B2A4A] shadow-sm" : "text-gray-500"}`}>
            {t === "browse" ? "Browse Tasks" : "My Activity"}
          </button>
        ))}
      </div>

      {/* Browse Tasks */}
      {tab === "browse" && (
        <>
          {/* Category scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide snap-x">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={`shrink-0 snap-start px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${category === cat ? "bg-[#1B2A4A] text-white border-[#1B2A4A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                {cat}
              </button>
            ))}
          </div>
          {/* Town filter */}
          <div className="mb-4">
            <select value={town} onChange={(e) => setTown(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20">
              {TOWNS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#1B2A4A]" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-bold text-[#1B2A4A] mb-1">No tasks found</h3>
              <p className="text-gray-500 text-sm">Be the first to post a task in this area.</p>
              <Link href="/post-task"><Button className="mt-4 rounded-2xl bg-[#1B2A4A]">Post a Task</Button></Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} userId={user?.id} onClaimed={handleClaimed} />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Activity */}
      {tab === "activity" && (
        <div className="space-y-5">
          {!isAuthenticated && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-500 mb-4">Log in to see your activity.</p>
              <Button onClick={login} className="rounded-2xl bg-[#1B2A4A]">Log in</Button>
            </div>
          )}
          {isAuthenticated && (
            <>
              <div>
                <h3 className="font-bold text-[#1B2A4A] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#1B2A4A]/10 flex items-center justify-center text-[#1B2A4A] text-xs font-bold">{myTasksData?.tasks.length ?? 0}</span>
                  My Posted Tasks
                </h3>
                {myTasksData?.tasks.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 text-center">
                    No tasks posted yet. <Link href="/post-task" className="text-[#1B2A4A] font-semibold underline">Post one now →</Link>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {myTasksData?.tasks.map((task) => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow">
                          <div>
                            <p className="font-semibold text-[#1B2A4A] text-sm">{task.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{task.town ?? task.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-600">${task.pay}</span>
                            {statusBadge(task.status)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-[#1B2A4A] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] text-xs font-bold">{myAppsData?.applications.length ?? 0}</span>
                  My Applications
                </h3>
                {myAppsData?.applications.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 text-center">
                    No applications yet. <Link href="/dashboard" className="text-[#1B2A4A] font-semibold underline">Find a task →</Link>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {myAppsData?.applications.map((app) => (
                      app.task && (
                        <Link key={app.id} href={`/tasks/${app.task.id}`}>
                          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow">
                            <div>
                              <p className="font-semibold text-[#1B2A4A] text-sm">{app.task.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Applied</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">${app.task.pay}</span>
                              {statusBadge(app.status)}
                            </div>
                          </div>
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
