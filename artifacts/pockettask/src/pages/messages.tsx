import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { MessageCircle, Loader2, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Conversation = {
  taskId: number;
  taskTitle: string;
  otherUser: { id: string; username: string; firstName?: string | null; profileImage?: string | null };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export default function Messages() {
  const { isAuthenticated } = useAuth();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/users/me/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setConvos(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B2A4A]" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Messages</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your task conversations.</p>
      </div>

      {convos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-bold text-[#1B2A4A] mb-1">No conversations yet</h3>
          <p className="text-sm text-gray-500 mb-4">Claim a task to start chatting with a task giver.</p>
          <Link href="/dashboard">
            <span className="inline-block bg-[#1B2A4A] text-white px-5 py-2 rounded-xl font-semibold text-sm">Browse Tasks</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {convos.map((c) => {
            const name = c.otherUser.firstName ?? c.otherUser.username;
            const initials = (c.otherUser.firstName?.[0] ?? c.otherUser.username?.[0] ?? "?").toUpperCase();
            const timeStr = c.lastMessageAt
              ? new Date(c.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "";
            return (
              <Link key={c.taskId} href={`/tasks/${c.taskId}`}>
                <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarImage src={c.otherUser.profileImage ?? undefined} />
                    <AvatarFallback className="bg-[#1B2A4A]/10 text-[#1B2A4A] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[#1B2A4A] text-sm truncate">{name}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {timeStr && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeStr}</span>}
                        {c.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#F5A623] text-white text-[10px] font-bold flex items-center justify-center">{c.unreadCount}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      <span className="text-gray-400">{c.taskTitle} · </span>
                      {c.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
