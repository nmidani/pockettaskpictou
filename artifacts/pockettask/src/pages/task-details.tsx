import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetTask, 
  useGetTaskApplications, 
  useApplyToTask, 
  useUpdateApplication,
  getGetTaskQueryKey,
  getGetTaskApplicationsQueryKey
} from "@workspace/api-client-react";
import { MapPin, Clock, DollarSign, User, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function TaskDetails() {
  const { id } = useParams();
  const taskId = parseInt(id || "0", 10);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: task, isLoading: isLoadingTask, error } = useGetTask(taskId);
  const { data: appsData, isLoading: isLoadingApps } = useGetTaskApplications(taskId, {
    query: { enabled: !!task && user?.id === task.postedById }
  });

  const { mutateAsync: applyToTask, isPending: isApplying } = useApplyToTask();
  const { mutateAsync: updateApplication, isPending: isUpdating } = useUpdateApplication();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");

  if (isLoadingTask) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (error || !task) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Task Not Found</h2>
        <p className="text-muted-foreground">This task may have been deleted or doesn't exist.</p>
        <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
      </div>
    );
  }

  const isOwner = user?.id === task.postedById;
  const isAssignedToMe = user?.id === task.assignedToId;

  const handleApply = async () => {
    try {
      await applyToTask({ id: taskId, data: { message: applyMessage } });
      toast({ title: "Application sent!", description: "The task poster has been notified." });
      setIsApplyModalOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to apply", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdateApp = async (appId: number, status: "accepted" | "rejected") => {
    try {
      await updateApplication({ id: appId, data: { status } });
      toast({ title: `Application ${status}` });
      queryClient.invalidateQueries({ queryKey: getGetTaskApplicationsQueryKey(taskId) });
      queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 mb-20 md:mb-0">
      <Link href="/dashboard" className="text-primary font-medium hover:underline mb-6 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Task Info */}
          <div className="bg-card p-6 md:p-10 rounded-3xl border border-border shadow-lg shadow-black/5">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge variant="outline" className="px-3 py-1 text-sm bg-secondary/50 border-border">
                {task.category}
              </Badge>
              <Badge className={`px-3 py-1 text-sm capitalize ${task.status === 'open' ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              {task.title}
            </h1>

            <div className="flex flex-wrap gap-6 text-muted-foreground mb-8 pb-8 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider">Pay</p>
                  <p className="font-bold text-foreground text-lg">${task.pay.toFixed(2)}</p>
                </div>
              </div>
              
              {task.estimatedHours && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider">Time</p>
                    <p className="font-bold text-foreground text-lg">{task.estimatedHours} hrs</p>
                  </div>
                </div>
              )}
              
              {task.locationName && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider">Location</p>
                    <p className="font-bold text-foreground text-lg">{task.locationName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-4">Details</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">
                {task.description}
              </p>
            </div>
            
            <div className="mt-8 text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Posted on {format(new Date(task.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </div>
          </div>

          {/* Owner Applications View */}
          {isOwner && task.status === 'open' && (
            <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                Applications <Badge variant="secondary" className="ml-2">{task.applicationCount}</Badge>
              </h3>
              
              {isLoadingApps ? (
                <div className="space-y-4">
                  {[1,2].map(i => <div key={i} className="h-24 bg-secondary/50 rounded-xl animate-pulse" />)}
                </div>
              ) : appsData?.applications.length ? (
                <div className="space-y-4">
                  {appsData.applications.map(app => (
                    <Card key={app.id} className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div className="flex gap-4 items-start">
                        <Avatar className="w-12 h-12 border border-border">
                          <AvatarImage src={app.applicant.profileImage || undefined} />
                          <AvatarFallback>{app.applicant.username.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">{app.applicant.firstName} {app.applicant.lastName || app.applicant.username}</p>
                          {app.message && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">"{app.message}"</p>}
                          <p className="text-xs text-muted-foreground mt-2">{format(new Date(app.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto text-destructive hover:bg-destructive/10 border-destructive/20"
                          onClick={() => handleUpdateApp(app.id, 'rejected')}
                          disabled={isUpdating}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button 
                          className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleUpdateApp(app.id, 'accepted')}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Accept
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No one has applied yet. Check back soon!</p>
              )}
            </div>
          )}

          {/* Assigned Information */}
          {task.status !== 'open' && task.assignedTo && (
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Task {task.status.replace('_', ' ')}</h3>
                <p className="text-muted-foreground">Assigned to <span className="font-semibold text-foreground">{task.assignedTo.firstName || task.assignedTo.username}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-4 text-foreground">Posted By</h3>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={task.postedBy.profileImage || undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">{task.postedBy.username.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg text-foreground leading-tight">
                  {task.postedBy.firstName ? `${task.postedBy.firstName} ${task.postedBy.lastName || ''}` : task.postedBy.username}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <User className="w-3 h-3" /> Neighbor
                </p>
              </div>
            </div>

            {!isOwner && task.status === 'open' && (
              <>
                {isAuthenticated ? (
                  <Button 
                    className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5" 
                    onClick={() => setIsApplyModalOpen(true)}
                  >
                    Apply for this Task
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-secondary/50 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground mb-3">Log in to offer your help.</p>
                    <Link href="/">
                      <Button variant="outline" className="w-full">Go to Login</Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {isAssignedToMe && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <p className="text-green-700 dark:text-green-400 font-bold">You are assigned to this task!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Offer to Help</DialogTitle>
            <DialogDescription className="text-base">
              Let the poster know you're interested in doing this task.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-semibold mb-2 block">Message (Optional)</label>
            <Textarea 
              placeholder="Hi, I live nearby and can help you with this today..."
              className="resize-none h-32 rounded-xl"
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleApply} disabled={isApplying} className="rounded-xl font-bold shadow-md shadow-primary/20">
              {isApplying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
