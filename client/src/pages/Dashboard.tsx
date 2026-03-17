import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskCard } from "@/components/TaskCard";
import { PICTOU_TOWNS, TASK_CATEGORIES } from "@/lib/utils";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [town, setTown] = useState("");
  const [category, setCategory] = useState("");
  
  const { data: tasks, isLoading } = useTasks({ 
    status: "open", 
    ...(town && { town }), 
    ...(category && { category }) 
  });

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-foreground tracking-tight mb-2">
            Available Tasks
          </h1>
          <p className="text-lg text-muted-foreground">Find a way to help out and earn locally.</p>
        </div>

        <Link href="/map">
          <Button variant="secondary" className="w-full md:w-auto gap-2">
            <MapPin className="w-5 h-5" />
            View on Map
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 bg-card rounded-2xl shadow-sm border border-border/50 p-2 flex items-center gap-2">
          <div className="flex-1 flex items-center border-r border-border/50 px-2">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-foreground py-2 outline-none font-medium appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 flex items-center px-2">
            <MapPin className="w-5 h-5 text-muted-foreground mr-2" />
            <select 
              value={town} 
              onChange={e => setTown(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-foreground py-2 outline-none font-medium appearance-none cursor-pointer"
            >
              <option value="">All Towns</option>
              {PICTOU_TOWNS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/50 shadow-sm">
          <img 
            src={`${import.meta.env.BASE_URL}images/empty-tasks.png`}
            alt="No tasks found"
            className="w-48 h-48 mx-auto mb-6 opacity-80 mix-blend-multiply"
          />
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">No tasks found</h3>
          <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
            Try adjusting your filters or be the first to post a new task in this area!
          </p>
          <Button onClick={() => { setTown(""); setCategory(""); }}>Clear Filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks?.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
