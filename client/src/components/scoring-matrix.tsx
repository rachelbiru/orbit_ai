import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, Clock, CheckCircle } from "lucide-react";
import type { ScheduleSlot, Score, Team, Station, User } from "@shared/schema";

interface ScoringMatrixProps {
  teams: Team[];
  stations: Station[];
  slots: ScheduleSlot[];
  scores: Score[];
  judges: User[];
}

type StatusType = "pending" | "ongoing" | "behind" | "complete";

interface CellStatus {
  status: StatusType;
  label: string;
  color: string;
  icon: React.ReactNode;
}

function getSlotStatus(slot: ScheduleSlot, scores: Score[]): CellStatus {
  const now = new Date();
  const hasScore = scores.some(s => s.slotId === slot.id);

  if (hasScore) {
    return {
      status: "complete",
      label: "Complete",
      color: "bg-green-500/10 border-green-500/30 text-green-500",
      icon: <CheckCircle className="w-3 h-3" />
    };
  }

  if (now < slot.startTime) {
    return {
      status: "pending",
      label: "Pending",
      color: "bg-slate-500/10 border-slate-500/30 text-slate-400",
      icon: <Clock className="w-3 h-3" />
    };
  }

  if (now >= slot.startTime && now < slot.endTime) {
    return {
      status: "ongoing",
      label: "Ongoing",
      color: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      icon: <Activity className="w-3 h-3 animate-pulse" />
    };
  }

  return {
    status: "behind",
    label: "Behind",
    color: "bg-red-500/10 border-red-500/30 text-red-400",
    icon: <AlertCircle className="w-3 h-3" />
  };
}

export function ScoringMatrix({
  teams,
  stations,
  slots,
  scores,
  judges,
}: ScoringMatrixProps) {
  const [view, setView] = useState<"team" | "station" | "judge">("team");

  // Map judge IDs to names
  const judgeMap = useMemo(() => {
    return new Map(judges.map(j => [j.id, j.name]));
  }, [judges]);

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-green-500 h-5 w-5 animate-pulse" />
            Scoring Progress Matrix
          </CardTitle>
        </div>

        {/* View Selector */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={view === "team" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("team")}
            data-testid="button-view-team"
          >
            Team View
          </Button>
          <Button
            variant={view === "station" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("station")}
            data-testid="button-view-station"
          >
            Station View
          </Button>
          <Button
            variant={view === "judge" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("judge")}
            data-testid="button-view-judge"
          >
            Judge View
          </Button>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-500" />
            <span>Ongoing</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span>Behind</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Pending</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto pb-6">
        {teams.length === 0 || stations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Waiting for teams and stations configuration...
          </div>
        ) : view === "team" ? (
          <TeamView teams={teams} stations={stations} slots={slots} scores={scores} getSlotStatus={getSlotStatus} />
        ) : view === "station" ? (
          <StationView teams={teams} stations={stations} slots={slots} scores={scores} getSlotStatus={getSlotStatus} />
        ) : (
          <JudgeView 
            teams={teams} 
            stations={stations} 
            slots={slots} 
            scores={scores} 
            judges={judges}
            judgeMap={judgeMap}
            getSlotStatus={getSlotStatus} 
          />
        )}
      </CardContent>
    </Card>
  );
}

function TeamView({
  teams,
  stations,
  slots,
  scores,
  getSlotStatus,
}: {
  teams: Team[];
  stations: Station[];
  slots: ScheduleSlot[];
  scores: Score[];
  getSlotStatus: (slot: ScheduleSlot, scores: Score[]) => CellStatus;
}) {
  return (
    <table className="w-full text-sm border-separate border-spacing-1">
      <thead>
        <tr>
          <th className="p-2 text-left font-medium text-muted-foreground w-48">Team</th>
          {stations.map(station => (
            <th key={station.id} className="p-2 text-center font-medium text-muted-foreground min-w-[120px]">
              {station.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {teams.map(team => (
          <tr key={team.id}>
            <td className="p-2 font-medium text-white bg-white/5 rounded-md">
              {team.name}
            </td>
            {stations.map(station => {
              const slot = slots.find(s => s.teamId === team.id && s.stationId === station.id);
              const status = slot ? getSlotStatus(slot, scores) : null;

              return (
                <td key={station.id} className="p-1">
                  {slot && status ? (
                    <div 
                      className={`h-12 rounded-md flex items-center justify-center font-bold border transition-all ${status.color}`}
                      data-testid={`cell-team-${team.id}-station-${station.id}`}
                      title={status.label}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        {status.icon}
                        <span className="text-xs font-medium">{status.label}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-12 rounded-md flex items-center justify-center text-muted-foreground border border-dashed border-muted">
                      -
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StationView({
  teams,
  stations,
  slots,
  scores,
  getSlotStatus,
}: {
  teams: Team[];
  stations: Station[];
  slots: ScheduleSlot[];
  scores: Score[];
  getSlotStatus: (slot: ScheduleSlot, scores: Score[]) => CellStatus;
}) {
  return (
    <table className="w-full text-sm border-separate border-spacing-1">
      <thead>
        <tr>
          <th className="p-2 text-left font-medium text-muted-foreground w-48">Station</th>
          {teams.map(team => (
            <th key={team.id} className="p-2 text-center font-medium text-muted-foreground min-w-[120px]">
              {team.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stations.map(station => (
          <tr key={station.id}>
            <td className="p-2 font-medium text-white bg-white/5 rounded-md">
              {station.name}
            </td>
            {teams.map(team => {
              const slot = slots.find(s => s.stationId === station.id && s.teamId === team.id);
              const status = slot ? getSlotStatus(slot, scores) : null;

              return (
                <td key={team.id} className="p-1">
                  {slot && status ? (
                    <div 
                      className={`h-12 rounded-md flex items-center justify-center font-bold border transition-all ${status.color}`}
                      data-testid={`cell-station-${station.id}-team-${team.id}`}
                      title={status.label}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        {status.icon}
                        <span className="text-xs font-medium">{status.label}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-12 rounded-md flex items-center justify-center text-muted-foreground border border-dashed border-muted">
                      -
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function JudgeView({
  teams,
  stations,
  slots,
  scores,
  judges,
  judgeMap,
  getSlotStatus,
}: {
  teams: Team[];
  stations: Station[];
  slots: ScheduleSlot[];
  scores: Score[];
  judges: User[];
  judgeMap: Map<number, string>;
  getSlotStatus: (slot: ScheduleSlot, scores: Score[]) => CellStatus;
}) {
  // Get unique judge-station combinations
  const judgeStations = useMemo(() => {
    const map = new Map<number, Set<number>>();
    slots.forEach(slot => {
      slot.judgeIds?.forEach(judgeId => {
        if (!map.has(judgeId)) {
          map.set(judgeId, new Set());
        }
        map.get(judgeId)!.add(slot.stationId);
      });
    });
    return map;
  }, [slots]);

  const activeJudges = judges.filter(j => judgeStations.has(j.id));

  return (
    <div className="space-y-6">
      {activeJudges.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No judges assigned yet
        </div>
      ) : (
        activeJudges.map(judge => {
          const stationIds = Array.from(judgeStations.get(judge.id) || []);
          const judgeSlots = slots.filter(s => s.judgeIds?.includes(judge.id));

          return (
            <div key={judge.id}>
              <h3 className="text-sm font-semibold mb-3 text-white">
                {judge.name} - {judgeSlots.length} assignments
              </h3>
              <table className="w-full text-sm border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-medium text-muted-foreground w-40">Team</th>
                    {stationIds.map(stationId => {
                      const station = stations.find(s => s.id === stationId);
                      return (
                        <th key={stationId} className="p-2 text-center font-medium text-muted-foreground min-w-[100px]">
                          {station?.name}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id}>
                      <td className="p-2 font-medium text-white bg-white/5 rounded-md text-xs">
                        {team.name}
                      </td>
                      {stationIds.map(stationId => {
                        const slot = slots.find(
                          s => s.teamId === team.id && 
                               s.stationId === stationId && 
                               s.judgeIds?.includes(judge.id)
                        );
                        const status = slot ? getSlotStatus(slot, scores) : null;

                        return (
                          <td key={stationId} className="p-1">
                            {slot && status ? (
                              <div 
                                className={`h-12 rounded-md flex items-center justify-center font-bold border transition-all ${status.color}`}
                                data-testid={`cell-judge-${judge.id}-team-${team.id}-station-${stationId}`}
                                title={status.label}
                              >
                                <div className="flex flex-col items-center gap-0.5">
                                  {status.icon}
                                  <span className="text-xs font-medium">{status.label}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-12 rounded-md flex items-center justify-center text-muted-foreground border border-dashed border-muted">
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
