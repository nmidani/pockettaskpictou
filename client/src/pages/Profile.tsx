import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMyTasks } from "@/hooks/use-tasks";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { LogOut, Star, Settings, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { PICTOU_TOWNS } from "@/lib/utils";

export default function Profile() {
  const { user, profile, updateProfile, logout } = useAuth();
  const { data: myTasks } = useMyTasks();
  const [editOpen, setEditOpen] = useState(false);
  const [town, setTown] = useState(profile?.town || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [role, setRole] = useState(profile?.role || "task_taker");

  if (!user || !profile) return null;

  const handleSave = async () => {
    await updateProfile.mutateAsync({ town, bio, role });
    setEditOpen(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-primary-foreground shadow-2xl shadow-primary/20 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 bg-white text-primary rounded-[2rem] flex items-center justify-center font-display font-extrabold text-5xl shadow-inner border-4 border-white/20">
            {user.username[0]?.toUpperCase()}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-display font-bold mb-2">{user.username}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold backdrop-blur-sm">
                {profile.role === 'task_giver' ? 'Task Poster' : 'Helper'}
              </span>
              {profile.town && (
                <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold backdrop-blur-sm">
                  📍 {profile.town}
                </span>
              )}
              <span className="flex items-center gap-1 text-warning bg-white/20 px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-sm">
                <Star className="w-4 h-4 fill-warning" /> 
                {profile.rating ? profile.rating.toFixed(1) : "New"} ({profile.reviewCount})
              </span>
            </div>
            <p className="text-primary-foreground/90 max-w-xl leading-relaxed">
              {profile.bio || "No bio added yet. Tell the community about yourself!"}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
            <Button variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
              <Settings className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
            <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
            <h3 className="font-display font-bold text-xl mb-4">Community Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Tasks Posted</span>
                <span className="font-display font-bold text-2xl">{profile.tasksPosted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Tasks Completed</span>
                <span className="font-display font-bold text-2xl text-primary">{profile.tasksCompleted}</span>
              </div>
            </div>
          </div>

          <div className="bg-success/5 border border-success/20 p-6 rounded-3xl text-success flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold mb-1">Trusted Member</h4>
              <p className="text-sm opacity-90">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-2xl font-display font-bold mb-6">Your Activity</h2>
          {myTasks?.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-3xl border border-border/50 border-dashed">
              <p className="text-muted-foreground font-medium text-lg">You haven't posted any tasks yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {myTasks?.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen} title="Edit Profile">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Primary Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary font-medium">
              <option value="task_taker">Helper (Looking for tasks)</option>
              <option value="task_giver">Poster (Need things done)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Town (Pictou County)</label>
            <select value={town} onChange={e => setTown(e.target.value)} className="w-full p-3 rounded-xl border-2 border-border focus:border-primary font-medium">
              <option value="">Select your town</option>
              {PICTOU_TOWNS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people what skills you have, or what kind of help you usually need..."
              className="w-full p-3 rounded-xl border-2 border-border focus:border-primary resize-none h-24 font-medium"
            />
          </div>
          <Button className="w-full" size="lg" onClick={handleSave} isLoading={updateProfile.isPending}>
            Save Changes
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
