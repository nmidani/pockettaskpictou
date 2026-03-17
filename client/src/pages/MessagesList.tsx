import { useConversations } from "@/hooks/use-interactions";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

export default function MessagesList() {
  const { data: convos, isLoading } = useConversations();

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-4xl font-display font-extrabold text-foreground mb-8">Messages</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-2xl border border-border/50" />)}
        </div>
      ) : convos?.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-3xl border border-border/50 shadow-sm">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-2">No messages yet</h3>
          <p className="text-muted-foreground text-lg">Claim a task or accept a helper to start chatting.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {convos?.map(convo => (
            <Link key={`${convo.taskId}-${convo.otherUser.id}`} href={`/chat/${convo.taskId}`}>
              <div className="bg-card hover:bg-muted/30 p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex items-center gap-5 cursor-pointer group">
                <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-display font-bold text-xl flex-shrink-0 shadow-inner">
                  {convo.otherUser.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors">
                      {convo.otherUser.username}
                    </h3>
                    {convo.lastMessageAt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(convo.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground/70 truncate mb-1">Task: {convo.taskTitle}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {convo.lastMessage || "No messages yet"}
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <div className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                    {convo.unreadCount}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
