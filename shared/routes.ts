import { z } from "zod";
import { insertUserSchema, insertEventSchema, insertStationSchema, insertTeamSchema, insertScheduleSlotSchema, insertScoreSchema, users, events, stations, teams, scheduleSlots, scores } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: { 200: z.void() },
    },
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.void(),
      },
    },
  },
  events: {
    list: {
      method: "GET" as const,
      path: "/api/events",
      responses: { 200: z.array(z.custom<typeof events.$inferSelect>()) },
    },
    get: {
      method: "GET" as const,
      path: "/api/events/:id",
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/events",
      input: insertEventSchema,
      responses: { 201: z.custom<typeof events.$inferSelect>() },
    },
  },
  stations: {
    list: {
      method: "GET" as const,
      path: "/api/events/:eventId/stations",
      responses: { 200: z.array(z.custom<typeof stations.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/stations",
      input: insertStationSchema,
      responses: { 201: z.custom<typeof stations.$inferSelect>() },
    },
  },
  teams: {
    list: {
      method: "GET" as const,
      path: "/api/events/:eventId/teams",
      responses: { 200: z.array(z.custom<typeof teams.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/teams",
      input: insertTeamSchema,
      responses: { 201: z.custom<typeof teams.$inferSelect>() },
    },
  },
  slots: {
    list: {
      method: "GET" as const,
      path: "/api/events/:eventId/slots",
      responses: { 200: z.array(z.custom<typeof scheduleSlots.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/slots",
      input: insertScheduleSlotSchema,
      responses: { 201: z.custom<typeof scheduleSlots.$inferSelect>() },
    },
  },
  scores: {
    list: {
      method: "GET" as const,
      path: "/api/events/:eventId/scores",
      responses: { 200: z.array(z.custom<typeof scores.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/scores",
      input: insertScoreSchema,
      responses: { 201: z.custom<typeof scores.$inferSelect>() },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
