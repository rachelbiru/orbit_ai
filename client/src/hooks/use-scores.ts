import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertScore } from "@shared/routes";

// Poll every 5s for dashboard
export function useScores(eventId: number) {
  return useQuery({
    queryKey: [api.scores.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.scores.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scores");
      return api.scores.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
    enabled: !!eventId,
  });
}

export function useCreateScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertScore) => {
      const validated = api.scores.create.input.parse(data);
      const res = await fetch(api.scores.create.path, {
        method: api.scores.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit score");
      return api.scores.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate scores list
      queryClient.invalidateQueries({ queryKey: [api.scores.list.path] });
    },
  });
}
