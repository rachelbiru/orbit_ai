import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertStation } from "@shared/routes";

export function useStations(eventId: number) {
  return useQuery({
    queryKey: [api.stations.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.stations.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stations");
      return api.stations.list.responses[200].parse(await res.json());
    },
    enabled: !!eventId,
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertStation) => {
      const validated = api.stations.create.input.parse(data);
      const res = await fetch(api.stations.create.path, {
        method: api.stations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create station");
      return api.stations.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.stations.list.path, variables.eventId] });
    },
  });
}
