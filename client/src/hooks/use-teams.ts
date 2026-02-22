import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertTeam } from "@shared/routes";

export function useTeams(eventId: number) {
  return useQuery({
    queryKey: [api.teams.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.teams.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teams");
      return api.teams.list.responses[200].parse(await res.json());
    },
    enabled: !!eventId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTeam) => {
      const validated = api.teams.create.input.parse(data);
      const res = await fetch(api.teams.create.path, {
        method: api.teams.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create team");
      return api.teams.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path, variables.eventId] });
    },
  });
}
