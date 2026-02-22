import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertScheduleSlot } from "@shared/routes";

export function useSlots(eventId: number) {
  return useQuery({
    queryKey: [api.slots.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.slots.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return api.slots.list.responses[200].parse(await res.json());
    },
    enabled: !!eventId,
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertScheduleSlot) => {
      // Convert Date objects to ISO strings if needed, though Zod handles date coercion
      const res = await fetch(api.slots.create.path, {
        method: api.slots.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create slot");
      return api.slots.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.slots.list.path, variables.eventId] });
    },
  });
}
