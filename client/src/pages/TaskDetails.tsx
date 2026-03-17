import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useTask, useClaimTask, useCompleteTask } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Clock, DollarSign, User, MessageCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useSubmitRating } from "@/hooks/use-interactions";

export default function TaskDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const taskId = parseInt(id || "0", 10);
  const { data: task, isLoading } = useTask(taskId);
  const { user } = useAuth();
  
  const claimTask = useClaimTask();
  const completeTask = useCompleteTask();
  const submitRating = useSubmitRating();

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState("");

  if (isLoading) return <div className="p-8 text-center animate-pulse"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!task) return <div className="p-8 text-center text-xl font-bold">Task not found.</div>;

  const isOwner = user?.id === task.postedById;
  const isClaimer = user?.id === task.claimedById;
  
  const handleClaim = async () => {
    if (!user) { setLocation("/api/login"); return; }
    if (confirm("Are you sure you want to claim this task? First-come, first-served!")) {
      try {
        await claimTask.mutateAsync(taskId);
      } catch (err: any) {
        alert(err.message || "Failed to claim task. It might have just been taken!");
      }
    }
  };

  const handleComplete = async () => {
    if (confirm("Mark this task as fully completed?")) {
      await completeTask.mutateAsync(taskId);
      setRatingOpen(true);
    }
  };

  const handleRate = async () => {
    const ratedId = isOwner ? task.claimedById! : task.postedById;
    await submitRating.mutateAsync({ taskId, ratedId, rating: ratingVal, review: reviewText });
    setRatingOpen(false);
    alert("Rating submitted! Thank you.");
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in pb-24">
      <div className="mb-6 flex items-center justify-between">
        <Badge variant={task.status === 'open' ? 'success' : 'default'} className="text-sm px-4 py-1.5 shadow-sm">
          {task.status.toUpperCase()}
        </Badge>
        <span className="text-muted-foreground font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" /> Posted {formatDistanceToNow(task.createdAt)} ago
        </span>
      </div>

      <div className="bg-card rounded-3xl p-8 md:p-10 shadow-xl shadow-black/5 border border-border/50 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-6 leading-tight">
            {task.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 mb-8 text-lg font-medium">
            <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-xl">
              <DollarSign className="w-6 h-6" />
              <span className="font-bold text-2xl">{formatCurrency(task.pay)}</span>
              <span className="text-sm uppercase bg-primary/20 px-2 py-0.5 rounded ml-2">{task.paymentMethod}</span>
            </div>
            {task.town && (
              <div className="flex items-center gap-2 text-foreground/80 bg-muted px-4 py-2 rounded-xl">
                <MapPin className="w-5 h-5" /> {task.town}
              </div>
            )}
            <div className="flex items-center gap-2 text-foreground/80 bg-muted px-4 py-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-success" /> Verified Local
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-muted-foreground mb-10">
            <h3 className="text-xl font-display font-bold text-foreground mb-3">Description</h3>
            <p className="whitespace-pre-wrap leading-relaxed">{task.description}</p>
          </div>

          {/* User Info Block */}
          <div className="bg-muted/50 rounded-2xl p-6 border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center font-display font-bold text-2xl shadow-inner">
                {task.postedBy?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Posted By</p>
                <p className="font-display font-bold text-xl">{task.postedBy?.username}</p>
              </div>
            </div>

            {task.claimedBy && (
              <>
                <div className="hidden sm:block w-px h-12 bg-border" />
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center font-display font-bold text-2xl shadow-inner">
                    {task.claimedBy.username?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Claimed By</p>
                    <p className="font-display font-bold text-xl">{task.claimedBy.username}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar - Fixed on mobile, static on desktop */}
      <div className="fixed bottom-[72px] md:bottom-auto md:static inset-x-0 p-4 md:p-0 bg-background/80 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-border/50 md:border-none z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
          {task.status === "open" && !isOwner && (
            <Button size="lg" className="flex-1 text-xl py-6 rounded-2xl" onClick={handleClaim} isLoading={claimTask.isPending}>
              Claim Task Now
            </Button>
          )}
          
          {(isOwner || isClaimer) && task.status === "claimed" && (
            <>
              <Button size="lg" variant="secondary" className="flex-1 text-lg rounded-2xl" onClick={() => setLocation(`/chat/${task.id}`)}>
                <MessageCircle className="w-5 h-5 mr-2" /> Message {isOwner ? "Helper" : "Poster"}
              </Button>
              <Button size="lg" className="flex-1 text-lg rounded-2xl" onClick={handleComplete} isLoading={completeTask.isPending}>
                Mark Completed
              </Button>
            </>
          )}

          {task.status === "completed" && (
            <div className="w-full text-center p-4 bg-success/10 text-success rounded-2xl font-bold text-xl border border-success/20">
              🎉 Task Completed Successfully!
            </div>
          )}
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen} title="Leave a Review">
        <div className="space-y-6">
          <p className="text-muted-foreground">How was your experience working with {isOwner ? task.claimedBy?.username : task.postedBy?.username}?</p>
          
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingVal(star)}
                className={`text-4xl transition-transform ${star <= ratingVal ? "text-secondary scale-110" : "text-muted hover:scale-105"}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Write a quick review... (optional)"
            className="w-full p-4 rounded-xl border-2 border-border focus:border-primary resize-none h-32"
          />

          <Button className="w-full" size="lg" onClick={handleRate} isLoading={submitRating.isPending}>
            Submit Review
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
