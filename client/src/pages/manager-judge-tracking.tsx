import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Users, Calendar, MapPin, User as UserIcon } from "lucide-react";
import type { User, Team, ScheduleSlot, Station, Event, Score } from "@shared/schema";
import { api } from "@shared/routes";

export default function ManagerJudgeTracking() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/events", activeEvent?.id, "teams"],
    queryFn: async () => {
      const res = await fetch(api.teams.list.path.replace(":eventId", String(activeEvent?.id)));
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
    enabled: !!activeEvent?.id,
  });

  const { data: stations = [], isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ["/api/events", activeEvent?.id, "stations"],
    queryFn: async () => {
      const res = await fetch(api.stations.list.path.replace(":eventId", String(activeEvent?.id)));
      if (!res.ok) throw new Error("Failed to fetch stations");
      return res.json();
    },
    enabled: !!activeEvent?.id,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery<ScheduleSlot[]>({
    queryKey: ["/api/events", activeEvent?.id, "slots"],
    queryFn: async () => {
      const res = await fetch(api.slots.list.path.replace(":eventId", String(activeEvent?.id)));
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
    enabled: !!activeEvent?.id,
  });

  const { data: scores = [], isLoading: scoresLoading } = useQuery<Score[]>({
    queryKey: ["/api/events", activeEvent?.id, "scores"],
    queryFn: async () => {
      const res = await fetch(api.scores.list.path.replace(":eventId", String(activeEvent?.id)));
      if (!res.ok) throw new Error("Failed to fetch scores");
      return res.json();
    },
    enabled: !!activeEvent?.id,
  });

  const { data: allJudges = [], isLoading: judgesLoading } = useQuery<User[]>({
    queryKey: ["/api/judges"],
  });

  const isDataLoading = teamsLoading || stationsLoading || slotsLoading || scoresLoading || judgesLoading;

  const getTeamById = (id: number) => teams.find((t) => t.id === id);
  const getStationById = (id: number) => stations.find((s) => s.id === id);
  const getJudgeById = (id: number) => allJudges.find((j) => j.id === id);

  const formatTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const slotDetails = useMemo(() => {
    return slots
      .map((slot) => {
        const team = getTeamById(slot.teamId);
        const station = getStationById(slot.stationId);
        const assignedJudges = (slot.judgeIds || []).map((jId) => getJudgeById(jId)).filter(Boolean) as User[];
        const slotScores = scores.filter((s) => s.slotId === slot.id);
        const judgesScored = assignedJudges.filter((j) => slotScores.some((s) => s.judgeId === j.id));
        const judgesNotScored = assignedJudges.filter((j) => !slotScores.some((s) => s.judgeId === j.id));
        const hasJudges = assignedJudges.length > 0;
        const allScored = hasJudges && judgesNotScored.length === 0;
        const someScored = judgesScored.length > 0 && judgesNotScored.length > 0;

        let scoringStatus: "complete" | "partial" | "pending" | "no_judges" = "pending";
        if (!hasJudges) scoringStatus = "no_judges";
        else if (allScored) scoringStatus = "complete";
        else if (someScored) scoringStatus = "partial";

        return {
          slot,
          team,
          station,
          assignedJudges,
          judgesScored,
          judgesNotScored,
          scoringStatus,
        };
      })
      .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());
  }, [slots, teams, stations, allJudges, scores]);

  const overallStats = useMemo(() => {
    const total = slotDetails.length;
    const complete = slotDetails.filter((s) => s.scoringStatus === "complete").length;
    const partial = slotDetails.filter((s) => s.scoringStatus === "partial").length;
    const pending = slotDetails.filter((s) => s.scoringStatus === "pending").length;
    const noJudges = slotDetails.filter((s) => s.scoringStatus === "no_judges").length;
    const behind = slotDetails.filter((s) => s.slot.status === "behind").length;
    const progressPercent = total > 0 ? (complete / total) * 100 : 0;

    return { total, complete, partial, pending, noJudges, behind, progressPercent };
  }, [slotDetails]);

  if (eventsLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading events...</div>;
  }

  if (eventsError) {
    return <div className="p-8 text-center text-destructive">Failed to load events. Please try again.</div>;
  }

  if (events.length === 0) {
    return (
      <Card className="bg-card/50 border-dashed border-2 border-muted p-12 text-center">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-bold">No Assigned Events</h3>
        <p className="text-muted-foreground">You have not been assigned to manage any events.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-progress-title">Slot Progress</h1>
          <p className="text-muted-foreground">Track scoring progress for every scheduled slot</p>
        </div>
      </div>

      {events.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {events.map((e) => (
            <Button
              key={e.id}
              variant={selectedEventId === e.id ? "default" : "outline"}
              onClick={() => setSelectedEventId(e.id)}
              data-testid={`button-event-${e.id}`}
            >
              {e.name}
            </Button>
          ))}
        </div>
      )}

      {activeEvent && isDataLoading && (
        <div className="p-8 text-center text-muted-foreground">Loading progress data...</div>
      )}

      {activeEvent && !isDataLoading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold" data-testid="stat-total-slots">{overallStats.total}</div>
                <p className="text-sm text-muted-foreground">Total Slots</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="stat-complete">{overallStats.complete}</div>
                <p className="text-sm text-muted-foreground">Scored</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="stat-partial">{overallStats.partial}</div>
                <p className="text-sm text-muted-foreground">Partial</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-muted-foreground" data-testid="stat-pending">{overallStats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="stat-behind">{overallStats.behind}</div>
                <p className="text-sm text-muted-foreground">Behind</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Slots Overview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Progress value={overallStats.progressPercent} className="h-2 w-32" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {Math.round(overallStats.progressPercent)}% complete
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {slotDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No slots scheduled for this event yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {slotDetails.map(({ slot, team, station, assignedJudges, judgesScored, judgesNotScored, scoringStatus }) => (
                    <div
                      key={slot.id}
                      className={`rounded-md border p-4 ${
                        slot.status === "behind"
                          ? "border-red-300 dark:border-red-800 bg-red-500/5"
                          : scoringStatus === "complete"
                          ? "border-green-300 dark:border-green-800 bg-green-500/5"
                          : "border-border"
                      }`}
                      data-testid={`slot-card-${slot.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex items-center gap-3 md:min-w-44 shrink-0">
                          <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${
                            scoringStatus === "complete"
                              ? "bg-green-500/15 text-green-600 dark:text-green-400"
                              : scoringStatus === "partial"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : slot.status === "behind"
                              ? "bg-red-500/15 text-red-600 dark:text-red-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {scoringStatus === "complete" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : slot.status === "behind" ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm" data-testid={`slot-time-${slot.id}`}>
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                            {slot.status === "behind" && (
                              <Badge variant="destructive" className="text-xs mt-0.5">Behind</Badge>
                            )}
                          </div>
                        </div>

                        <div className="h-px md:h-8 md:w-px bg-border shrink-0" />

                        <div className="flex items-center gap-2 md:min-w-40 shrink-0">
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate" data-testid={`slot-team-${slot.id}`}>
                            {team?.name || "Unknown Team"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 md:min-w-36 shrink-0">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground truncate" data-testid={`slot-station-${slot.id}`}>
                            {station?.name || "Unknown Station"}
                          </span>
                        </div>

                        <div className="h-px md:h-8 md:w-px bg-border shrink-0" />

                        <div className="flex-1 min-w-0">
                          {assignedJudges.length === 0 ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-400 dark:border-amber-600 text-xs">
                                No judges assigned
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {judgesScored.map((judge) => (
                                <Badge
                                  key={judge.id}
                                  className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 text-xs"
                                  data-testid={`judge-scored-${judge.id}-slot-${slot.id}`}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {judge.name}
                                </Badge>
                              ))}
                              {judgesNotScored.map((judge) => (
                                <Badge
                                  key={judge.id}
                                  variant="outline"
                                  className="text-xs"
                                  data-testid={`judge-pending-${judge.id}-slot-${slot.id}`}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {judge.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
