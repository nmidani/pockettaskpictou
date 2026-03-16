import { useState } from "react";
import { Link } from "wouter";
import { PlusCircle, Search, Filter } from "lucide-react";
import { useGetTasks, useGetMyPostedTasks, useGetMyApplications } from "@workspace/api-client-react";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@workspace/replit-auth-web";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: allTasksData, isLoading: isLoadingAll } = useGetTasks({ status: 'open' });
  const { data: myTasksData, isLoading: isLoadingMyTasks } = useGetMyPostedTasks(undefined, { 
    query: { enabled: isAuthenticated && activeTab === 'activity' } 
  });
  const { data: myAppsData, isLoading: isLoadingMyApps } = useGetMyApplications(undefined, {
    query: { enabled: isAuthenticated && activeTab === 'activity' }
  });

  const categories = ["all", "Yard Work", "Snow Removal", "Moving Help", "Grocery/Errands", "Pet Care", "Cleaning", "Home Repair", "Tech Help", "Tutoring", "Other"];

  const filteredTasks = allTasksData?.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Find tasks to do or manage your posted requests.</p>
        </div>
        
        {isAuthenticated && (
          <Link href="/post-task">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform w-full md:w-auto">
              <PlusCircle className="w-5 h-5 mr-2" />
              Post a New Task
            </Button>
          </Link>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex justify-center md:justify-start">
          <TabsList className="grid grid-cols-2 w-full md:w-[400px] h-12 rounded-full p-1 bg-secondary/50 backdrop-blur">
            <TabsTrigger value="browse" className="rounded-full font-semibold">Browse Tasks</TabsTrigger>
            <TabsTrigger value="activity" disabled={!isAuthenticated} className="rounded-full font-semibold">My Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="browse" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background border-input rounded-xl"
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 rounded-xl border-input bg-background">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Categories" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingAll ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 rounded-2xl bg-secondary/50 animate-pulse border border-border/50" />
              ))}
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-3xl border border-border/50 shadow-sm">
              <img src={`${import.meta.env.BASE_URL}images/empty-state.png`} alt="No tasks" className="w-48 h-48 mx-auto opacity-70 mb-6" />
              <h3 className="text-2xl font-bold text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any open tasks matching your search. Try adjusting your filters or check back later!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Posted Tasks Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <div className="w-2 h-8 bg-primary rounded-full" /> Tasks You Posted
            </h2>
            {isLoadingMyTasks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2].map(i => <div key={i} className="h-64 rounded-2xl bg-secondary/50 animate-pulse" />)}
              </div>
            ) : myTasksData?.tasks.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTasksData.tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-secondary/30 rounded-2xl border border-border border-dashed">
                <p className="text-muted-foreground">You haven't posted any tasks yet.</p>
                <Link href="/post-task">
                  <Button variant="link" className="mt-2 text-primary">Post your first task</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Applications Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <div className="w-2 h-8 bg-accent rounded-full" /> Tasks You Applied For
            </h2>
            {isLoadingMyApps ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2].map(i => <div key={i} className="h-64 rounded-2xl bg-secondary/50 animate-pulse" />)}
              </div>
            ) : myAppsData?.applications.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAppsData.applications.map(app => (
                  app.task ? <TaskCard key={app.taskId} task={app.task} /> : null
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-secondary/30 rounded-2xl border border-border border-dashed">
                <p className="text-muted-foreground">You haven't applied to any tasks yet.</p>
                <Button variant="link" className="mt-2 text-primary" onClick={() => setActiveTab('browse')}>Browse available tasks</Button>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
