import { Link } from "wouter";
import { MapPin, Clock, DollarSign, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Task } from "@/hooks/use-tasks";
import { formatDistanceToNow } from "date-fns";

export function TaskCard({ task }: { task: Task }) {
  const statusColors = {
    open: "success",
    claimed: "warning",
    in_progress: "warning",
    completed: "default",
    cancelled: "destructive",
  } as const;

  return (
    <Link href={`/tasks/${task.id}`} className="block group">
      <Card className="h-full overflow-hidden hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-5 flex flex-col h-full relative">
          <div className="flex justify-between items-start mb-3">
            <Badge variant={statusColors[task.status] as any} className="capitalize shadow-sm">
              {task.status.replace("_", " ")}
            </Badge>
            <div className="text-right">
              <span className="text-xl font-display font-bold text-primary">
                {formatCurrency(task.pay)}
              </span>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                {task.paymentMethod}
              </p>
            </div>
          </div>
          
          <h3 className="font-display font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {task.title}
          </h3>
          
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
            {task.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-auto pt-4 border-t border-border/50">
            {task.town && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-secondary-foreground/60" />
                <span className="font-medium text-foreground/80">{task.town}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-secondary-foreground/60" />
              <span>{formatDistanceToNow(task.createdAt)} ago</span>
            </div>
          </div>

          <div className="absolute right-4 bottom-4 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
