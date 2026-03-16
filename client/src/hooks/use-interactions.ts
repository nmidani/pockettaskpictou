import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

// --- MESSAGES ---
const messageSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  senderId: z.string(),
  content: z.string(),
  read: z.boolean(),
  createdAt: z.coerce.date(),
  sender: z.any(),
});

export type ChatMessage = z.infer<typeof messageSchema>;

export function useMessages(taskId: number) {
  return useQuery({
    queryKey: [`/api/messages/${taskId}`],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      return z.array(messageSchema).parse(data.messages);
    },
    refetchInterval: 3000, // Poll every 3s for real-time feel
    enabled: !!taskId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: number; content: string }) => {
      const res = await fetch(`/api/messages/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return messageSchema.parse(await res.json());
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/messages"] });
    },
  });
}

// --- CONVERSATIONS ---
const conversationSchema = z.object({
  taskId: z.number(),
  taskTitle: z.string(),
  otherUser: z.any(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.coerce.date().nullable(),
  unreadCount: z.number(),
});

export function useConversations() {
  return useQuery({
    queryKey: ["/api/users/me/messages"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/messages");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      return z.array(conversationSchema).parse(data.conversations);
    },
  });
}

// --- RATINGS ---
export function useSubmitRating() {
  return useMutation({
    mutationFn: async (data: { taskId: number; ratedId: string; rating: number; review?: string }) => {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      return res.json();
    }
  });
}

// --- REPORTS ---
export function useSubmitReport() {
  return useMutation({
    mutationFn: async (data: { targetType: "user" | "task"; targetId: string; reason: string; details?: string }) => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      return res.json();
    }
  });
}
