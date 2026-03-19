import { useParams, Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetTask } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Clock, Banknote, Smartphone, Star, AlertTriangle, Send, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = { id: number; senderId: string; content: string; createdAt: string; sender: { id: string; username: string; profileImage?: string | null; firstName?: string | null } };
type Toast = { message: string; type: "success" | "error" };

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((i) => (
        <Star key={i}
          className={`w-7 h-7 cursor-pointer transition-colors ${(hover || value) >= i ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300"}`}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

const REPORT_REASONS = ["Did not show up", "Scam", "Harassment", "Unsafe task", "Other"];

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, login } = useAuth();
  const taskId = parseInt(id);
  const { data: task, isLoading, refetch } = useGetTask(taskId);

  const [toast, setToast] = useState<Toast | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [ratingVal, setRatingVal] = useState(0);
  const [review, setReview] = useState("");
  const [ratingDone, setRatingDone] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reportDone, setReportDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(message: string, type: Toast["type"] = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Fetch messages for claimed tasks
  const canChat = task && (task.postedById === user?.id || task.claimedById === user?.id) && (task.status === "claimed" || task.status === "in_progress" || task.status === "completed");

  async function fetchMessages() {
    if (!canChat || !isAuthenticated) return;
    try {
      const res = await fetch(`/api/messages/${taskId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {}
  }

  useEffect(() => {
    if (canChat) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [canChat, isAuthenticated]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/claim`, { method: "POST", credentials: "include" });
      if (res.status === 409) {
        showToast("This task has already been taken.", "error");
      } else if (res.ok) {
        showToast("You claimed this task! Chat with the task giver below.", "success");
        refetch();
      } else {
        const d = await res.json();
        showToast(d.error ?? "Failed to claim task.", "error");
      }
    } finally {
      setClaiming(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: "POST", credentials: "include" });
      if (res.ok) {
        showToast("Task marked as completed!", "success");
        refetch();
      }
    } finally {
      setCompleting(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/messages/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: msgInput.trim() }),
      });
      if (res.ok) {
        setMsgInput("");
        fetchMessages();
      }
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleRating() {
    if (!ratingVal || !task) return;
    const ratedId = task.postedById === user?.id ? task.claimedById : task.postedById;
    if (!ratedId) return;
    setSubmittingRating(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId, ratedId, rating: ratingVal, review: review || null }),
      });
      if (res.ok) {
        setRatingDone(true);
        showToast("Rating submitted. Thanks!", "success");
      }
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleReport() {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ targetType: "task", targetId: String(taskId), reason: reportReason, details: reportDetails || null }),
    });
    if (res.ok) {
      setReportDone(true);
      setReportOpen(false);
      showToast("Report submitted. Thank you.", "success");
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1B2A4A]" /></div>;
  }
  if (!task) {
    return <div className="text-center py-20"><p className="text-gray-500">Task not found.</p><Link href="/dashboard"><Button className="mt-4 rounded-2xl">Back to Dashboard</Button></Link></div>;
  }

  const isOwner = user?.id === task.postedById;
  const isClaimer = user?.id === (task as any).claimedById;
  const isOpen = task.status === "open";
  const isClaimed = task.status === "claimed" || task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const canClaim = isAuthenticated && !isOwner && isOpen;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Back */}
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B2A4A] font-medium">
        <ArrowLeft className="w-4 h-4" />Back to Dashboard
      </Link>

      {/* Task card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider">{task.category}</span>
          {task.status === "open" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Open</span>}
          {isClaimed && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">In Progress</span>}
          {isCompleted && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Completed</span>}
        </div>
        <h1 className="text-2xl font-extrabold text-[#1B2A4A] mb-3">{task.title}</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-5">{task.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-semibold mb-0.5">Pay</p>
            <p className="text-2xl font-extrabold text-green-600">${task.pay}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-semibold mb-0.5">Payment</p>
            <p className="text-sm font-bold text-[#1B2A4A] flex items-center gap-1.5">
              {task.paymentMethod === "etransfer" ? <><Smartphone className="w-4 h-4" />eTransfer</> : <><Banknote className="w-4 h-4" />Cash</>}
            </p>
          </div>
          {task.town && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold mb-0.5">Location</p>
              <p className="text-sm font-bold text-[#1B2A4A] flex items-center gap-1"><MapPin className="w-4 h-4" />{task.town}</p>
            </div>
          )}
          {task.estimatedHours && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold mb-0.5">Duration</p>
              <p className="text-sm font-bold text-[#1B2A4A] flex items-center gap-1"><Clock className="w-4 h-4" />{task.estimatedHours}h</p>
            </div>
          )}
        </div>

        {/* Posted by */}
        {(task as any).postedBy && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
            <Avatar className="w-9 h-9">
              <AvatarImage src={(task as any).postedBy.profileImage ?? undefined} />
              <AvatarFallback className="bg-[#1B2A4A]/10 text-[#1B2A4A] text-xs font-bold">
                {((task as any).postedBy.firstName?.[0] ?? (task as any).postedBy.username?.[0] ?? "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-gray-400">Posted by</p>
              <p className="text-sm font-bold text-[#1B2A4A]">
                {(task as any).postedBy.firstName ? `${(task as any).postedBy.firstName} ${(task as any).postedBy.lastName ?? ""}`.trim() : (task as any).postedBy.username}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Claim action */}
      {!isAuthenticated && isOpen && (
        <div className="bg-[#1B2A4A] text-white rounded-2xl p-5 text-center">
          <p className="font-semibold mb-3">Log in to claim this task</p>
          <Button onClick={login} className="bg-[#F5A623] hover:bg-[#F5A623]/90 rounded-xl font-bold">Log in / Sign up</Button>
        </div>
      )}

      {canClaim && (
        <div className="bg-[#1B2A4A] rounded-2xl p-5 text-center text-white">
          <h3 className="font-bold text-lg mb-1">Ready to get to work?</h3>
          <p className="text-sm text-white/70 mb-4">First to claim gets the job. Be fast!</p>
          <Button onClick={handleClaim} disabled={claiming} className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-white rounded-xl font-bold px-8 h-11">
            {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Claim This Task →"}
          </Button>
        </div>
      )}

      {!isOpen && !isClaimed && !isCompleted && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-600 font-semibold">This task has already been taken.</p>
        </div>
      )}

      {/* Complete button (owner, after claimed) */}
      {isOwner && isClaimed && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-green-800 text-sm">Task in progress</p>
            <p className="text-green-600 text-xs">Mark complete when the work is done.</p>
          </div>
          <Button onClick={handleComplete} disabled={completing} className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shrink-0">
            {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Complete"}
          </Button>
        </div>
      )}

      {/* Chat section */}
      {canChat && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-[#1B2A4A]/5">
            <h3 className="font-bold text-[#1B2A4A] text-sm">Chat</h3>
            <p className="text-xs text-gray-500">Private conversation for this task</p>
          </div>
          <div className="h-60 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-8">No messages yet. Say hello!</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const name = msg.sender.firstName ?? msg.sender.username;
              return (
                <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-gray-400 px-1">{name}</span>
                  <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm font-medium leading-snug ${isMe ? "bg-[#1B2A4A] text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-gray-100 bg-white">
            <input
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
            />
            <Button type="submit" size="sm" disabled={sendingMsg || !msgInput.trim()} className="rounded-xl bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 px-3">
              {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      )}

      {/* Rating section */}
      {isCompleted && isAuthenticated && !ratingDone && (task.postedById === user?.id || (task as any).claimedById === user?.id) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-[#1B2A4A] mb-1">Rate your experience</h3>
          <p className="text-sm text-gray-500 mb-4">Help build trust in the community.</p>
          <StarRating value={ratingVal} onChange={setRatingVal} />
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write a short review (optional)…"
            rows={2}
            className="w-full mt-3 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 resize-none"
          />
          <Button onClick={handleRating} disabled={!ratingVal || submittingRating} className="mt-3 rounded-xl bg-[#F5A623] hover:bg-[#F5A623]/90 text-white font-bold w-full">
            {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Rating"}
          </Button>
        </div>
      )}
      {ratingDone && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 font-semibold text-sm">
          ⭐ Rating submitted — thanks for keeping PocketTask trustworthy!
        </div>
      )}

      {/* Report */}
      {isAuthenticated && !isOwner && (
        <div className="flex justify-end">
          <button onClick={() => setReportOpen(true)} className="text-xs text-gray-400 hover:text-red-500 underline flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />Report this task
          </button>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">Report Task</h3>
            <p className="text-xs text-gray-500 mb-4">Help us keep PocketTask safe.</p>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 bg-white">
              {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)…" rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 resize-none" />
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
