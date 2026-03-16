import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  pay: z.number(),
  paymentMethod: z.enum(["cash", "etransfer"]),
  status: z.enum(["open", "claimed", "in_progress", "completed", "cancelled"]),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  locationName: z.string().nullable().optional(),
  town: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  postedById: z.string(),
  claimedById: z.string().nullable().optional(),
  claimedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Task = z.infer<typeof taskSchema>;

const taskWithDetailsSchema = taskSchema.extend({
  postedBy: z.any(), // Simplified AuthUser
  claimedBy: z.any().nullable().optional(),
  applicationCount: z.number(),
});

export type TaskWithDetails = z.infer<typeof taskWithDetailsSchema>;

export function useTasks(filters?: { status?: string; category?: string; town?: string }) {
  return useQuery({
    queryKey: ["/api/tasks", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.category) params.append("category", filters.category);
      if (filters?.town) params.append("town", filters.town);
      
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      return z.array(taskSchema).parse(data.tasks);
    },
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: [`/api/tasks/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch task");
      }
      return taskWithDetailsSchema.parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ["/api/users/me/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/tasks");
      if (!res.ok) throw new Error("Failed to fetch my tasks");
      const data = await res.json();
      return z.array(taskSchema).parse(data.tasks);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create task");
      }
      return taskSchema.parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/tasks"] });
    },
  });
}

export function useClaimTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tasks/${id}/claim`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to claim task");
      }
      return taskSchema.parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to complete task");
      return taskSchema.parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${id}`] });
    },
  });
}
