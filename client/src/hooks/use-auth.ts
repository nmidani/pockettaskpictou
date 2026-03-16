import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
});

const userProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  town: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  tasksPosted: z.number().default(0),
  tasksCompleted: z.number().default(0),
  rating: z.number().nullable().optional(),
  reviewCount: z.number().default(0),
  createdAt: z.coerce.date(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

export function useAuth() {
  const queryClient = useQueryClient();

  // 1. Get base Replit Auth user
  const authQuery = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.user) return null;
      return authUserSchema.parse(data.user);
    },
    retry: false,
  });

  // 2. Get extended profile if logged in
  const profileQuery = useQuery({
    queryKey: ["/api/users/me"],
    enabled: !!authQuery.data,
    queryFn: async () => {
      const res = await fetch("/api/users/me");
      if (!res.ok) {
        if (res.status === 404 || res.status === 401) return null;
        throw new Error("Failed to fetch profile");
      }
      return userProfileSchema.parse(await res.json());
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return userProfileSchema.parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  return {
    user: authQuery.data,
    profile: profileQuery.data,
    isLoading: authQuery.isLoading || profileQuery.isLoading,
    isAuthenticated: !!authQuery.data,
    updateProfile,
    login: () => { window.location.href = "/api/login"; },
    logout: () => { window.location.href = "/api/logout"; },
  };
}
