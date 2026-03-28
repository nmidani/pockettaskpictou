import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  pay: number;
  paymentMethod: "cash" | "etransfer";
  estimatedHours: number | null;
  status: "open" | "claimed" | "completed" | "cancelled";
  lat: number | null;
  lng: number | null;
  locationName: string | null;
  town: string | null;
  postedById: string;
  claimedById: string | null;
  claimedAt: string | null;
  assignedToId: string | null;
  assignedAt: string | null;
  applicationWindowEndsAt: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  bio: string | null;
  phone: string | null;
  tasksPosted: number;
  tasksCompleted: number;
  avgRating: number | null;
  totalRatings: number;
  trustScore: number;
  role: string | null;
}

export function useGetTasks(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery<Task[]>({
    queryKey: ["tasks", params],
    queryFn: () => apiFetch(`/api/tasks${qs}`),
  });
}

export function useGetTask(id: number | string) {
  return useQuery<Task>({
    queryKey: ["tasks", id],
    queryFn: () => apiFetch(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export function useGetMyPostedTasks() {
  return useQuery<Task[]>({
    queryKey: ["my-posted-tasks"],
    queryFn: () => apiFetch("/api/users/me/tasks"),
  });
}

export function useGetMyApplications() {
  return useQuery<any[]>({
    queryKey: ["my-applications"],
    queryFn: () => apiFetch("/api/users/me/applications"),
  });
}

export function useGetMyProfile() {
  return useQuery<UserProfile>({
    queryKey: ["my-profile"],
    queryFn: () => apiFetch("/api/users/me"),
  });
}

export function getGetMyProfileQueryKey() {
  return ["my-profile"];
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      apiFetch("/api/users/me", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
    },
  });
}
