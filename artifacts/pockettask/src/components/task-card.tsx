import { format } from "date-fns";
import { MapPin, Clock, DollarSign, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Task } from "@workspace/api-client-react";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={`/tasks/${task.id}`} className="block group">
      <Card className="p-5 h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 bg-card border-border relative overflow-hidden group-hover:-translate-y-1 cursor-pointer">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-150" />
        
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className="text-xs font-semibold bg-secondary/50 backdrop-blur-sm">
            {task.category}
          </Badge>
          <Badge variant="outline" className={`capitalize ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
        
        <h3 className="font-display font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {task.title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {task.description}
        </p>
        
        <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm font-medium text-secondary-foreground mb-4">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-md">
            <DollarSign className="w-4 h-4" />
            <span>${task.pay.toFixed(2)}</span>
          </div>
          
          {task.estimatedHours && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{task.estimatedHours}h est.</span>
            </div>
          )}
          
          {task.locationName && (
            <div className="flex items-center gap-1.5 text-muted-foreground w-full sm:w-auto">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{task.locationName}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Posted {format(new Date(task.createdAt), 'MMM d')}
          </span>
          <div className="flex items-center text-primary text-sm font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            View Details <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
