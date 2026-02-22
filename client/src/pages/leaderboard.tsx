import { useEvents } from "@/hooks/use-events";
import { useScores } from "@/hooks/use-scores";
import { useTeams } from "@/hooks/use-teams";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Star, Lock } from "lucide-react";
import { Redirect } from "wouter";

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: events } = useEvents();
  const activeEvent = events?.find(e => e.isActive);

  // Judges cannot access the leaderboard
  if (user?.role === "judge") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Lock className="w-24 h-24 text-muted mb-6" />
        <h1 className="text-4xl font-bold font-display mb-4">Access Restricted</h1>
        <p className="text-muted-foreground text-lg">The leaderboard is not available for judges.</p>
        <p className="text-muted-foreground">Please use the Results page to view your assigned teams.</p>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Trophy className="w-24 h-24 text-muted mb-6" />
        <h1 className="text-4xl font-bold font-display mb-4">Leaderboard Offline</h1>
        <p className="text-muted-foreground text-lg">Results will appear here when an event is live.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
          {activeEvent.name}
        </h1>
        <p className="text-xl text-muted-foreground">Live Results</p>
      </div>

      <LeaderboardContent eventId={activeEvent.id} />
    </div>
  );
}

function LeaderboardContent({ eventId }: { eventId: number }) {
  const { data: teams } = useTeams(eventId);
  const { data: scores } = useScores(eventId);

  if (!teams || !scores) return <div className="text-center">Loading rankings...</div>;

  // Calculate total scores
  const teamScores = teams.map(team => {
    const teamScores = scores.filter(s => s.teamId === team.id);
    const totalPoints = teamScores.reduce((acc, curr) => {
      // Sum values of the scores json object
      const points = Object.values(curr.scores as Record<string, number>).reduce((a, b) => a + b, 0);
      return acc + points;
    }, 0);
    
    return { ...team, totalPoints };
  });

  const elementaryTeams = teamScores
    .filter(t => t.category === "ElementarySchool")
    .sort((a, b) => b.totalPoints - a.totalPoints);
    
  const middleTeams = teamScores
    .filter(t => t.category === "MiddleSchool")
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <Tabs defaultValue="elementary" className="space-y-8">
      <div className="flex justify-center">
        <TabsList className="bg-white/5 p-1 rounded-full border border-white/10">
          <TabsTrigger value="elementary" className="rounded-full px-8 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Elementary School
          </TabsTrigger>
          <TabsTrigger value="middle" className="rounded-full px-8 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            Middle School
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="elementary">
        <RankingList teams={elementaryTeams} />
      </TabsContent>
      
      <TabsContent value="middle">
        <RankingList teams={middleTeams} />
      </TabsContent>
    </Tabs>
  );
}

function RankingList({ teams }: { teams: any[] }) {
  return (
    <div className="space-y-4">
      {teams.map((team, index) => (
        <Card 
          key={team.id}
          className={`
            border-0 relative overflow-hidden transition-transform hover:scale-[1.01]
            ${index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 ring-1 ring-yellow-500/50' : 'bg-card/50'}
          `}
        >
          {index === 0 && <div className="absolute top-0 right-0 p-4"><Trophy className="text-yellow-500 h-8 w-8" /></div>}
          
          <CardContent className="p-6 flex items-center gap-6">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
              ${index === 0 ? 'bg-yellow-500 text-black' : 
                index === 1 ? 'bg-slate-300 text-black' :
                index === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-muted-foreground'}
            `}>
              {index + 1}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{team.name}</h3>
              <p className="text-muted-foreground">{team.schoolName}</p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold font-mono tracking-tighter text-white">
                {team.totalPoints}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Points</div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {teams.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No teams registered in this category yet.
        </div>
      )}
    </div>
  );
}
