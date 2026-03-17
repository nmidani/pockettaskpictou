import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMessages, useSendMessage } from "@/hooks/use-interactions";
import { useTask } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const { id } = useParams();
  const taskId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: task, isLoading: taskLoading } = useTask(taskId);
  const { data: messages, isLoading: msgLoading } = useMessages(taskId);
  const sendMessage = useSendMessage();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (taskLoading || msgLoading) return <div className="p-8 text-center animate-pulse">Loading chat...</div>;
  if (!task) return <div className="p-8">Task not found</div>;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const txt = input.trim();
    setInput("");
    await sendMessage.mutateAsync({ taskId, content: txt });
  };

  const otherUser = task.postedById === user?.id ? task.claimedBy : task.postedBy;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-3xl mx-auto bg-background animate-fade-in">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <button onClick={() => setLocation(`/tasks/${taskId}`)} className="mr-4 p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="font-display font-bold text-lg leading-tight">{otherUser?.username || "User"}</h2>
          <p className="text-xs text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
            Re: {task.title}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 md:pb-4">
        {messages?.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground h-full flex items-center justify-center flex-col">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">👋</div>
            <p className="font-medium">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages?.map((msg, i) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                  isMe 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/10' 
                    : 'bg-card border border-border/50 text-foreground rounded-tl-sm shadow-sm'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1 font-medium uppercase tracking-wider">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-card pb-safe fixed md:static bottom-[56px] md:bottom-0 inset-x-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-5 py-4 rounded-2xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all font-medium"
          />
          <Button type="submit" size="icon" className="h-[56px] w-[56px] rounded-2xl" disabled={!input.trim() || sendMessage.isPending}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
