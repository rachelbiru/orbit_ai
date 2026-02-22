import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, User as UserIcon, Clock, CheckCircle, Mail, Search } from "lucide-react";
import type { User, Notification, Event } from "@shared/schema";
import { api } from "@shared/routes";
import { format } from "date-fns";

export default function ManagerMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const eventJudgeIds = useMemo(() => {
    const ids = new Set<number>();
    events.forEach((e) => {
      e.judgeIds?.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [events]);

  const { data: allJudges = [] } = useQuery<User[]>({
    queryKey: ["/api/judges"],
  });

  const eventJudges = useMemo(() => {
    return allJudges.filter((j) => eventJudgeIds.includes(j.id));
  }, [allJudges, eventJudgeIds]);

  const { data: allNotifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/all"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/all");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const myNotifications = useMemo(() => {
    return allNotifications.filter((n) => eventJudgeIds.includes(n.judgeId));
  }, [allNotifications, eventJudgeIds]);

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ judgeId, message }: { judgeId: number; message: string }) => {
      return apiRequest("POST", "/api/notifications/send", { judgeId, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/all"] });
      toast({ title: "Message Sent", description: "Your message has been delivered." });
      setComposeOpen(false);
      setSelectedJudgeId("");
      setMessage("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!selectedJudgeId || !message.trim()) {
      toast({ title: "Error", description: "Please select a judge and enter a message", variant: "destructive" });
      return;
    }
    sendNotificationMutation.mutate({ judgeId: parseInt(selectedJudgeId), message: message.trim() });
  };

  const getJudgeById = (id: number) => allJudges.find((j) => j.id === id);

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return myNotifications;
    const query = searchQuery.toLowerCase();
    return myNotifications.filter((n) => {
      const judge = getJudgeById(n.judgeId);
      return (
        n.message.toLowerCase().includes(query) ||
        judge?.name.toLowerCase().includes(query) ||
        judge?.username.toLowerCase().includes(query)
      );
    });
  }, [myNotifications, searchQuery]);

  const groupedByJudge = useMemo(() => {
    const groups: Record<number, Notification[]> = {};
    filteredNotifications.forEach((n) => {
      if (!groups[n.judgeId]) groups[n.judgeId] = [];
      groups[n.judgeId].push(n);
    });
    Object.values(groups).forEach((arr) => {
      arr.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    });
    return groups;
  }, [filteredNotifications]);

  const sortedJudgeIds = useMemo(() => {
    return Object.keys(groupedByJudge)
      .map(Number)
      .sort((a, b) => {
        const aLatest = groupedByJudge[a][0]?.createdAt;
        const bLatest = groupedByJudge[b][0]?.createdAt;
        return new Date(bLatest!).getTime() - new Date(aLatest!).getTime();
      });
  }, [groupedByJudge]);

  if (eventsLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading messages...</div>;
  }

  if (eventsError) {
    return <div className="p-8 text-center text-destructive">Failed to load data. Please try again.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Complete history of messages sent to judges</p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-compose">
              <Send className="mr-2 h-4 w-4" /> New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message to Judge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Judge</Label>
                <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
                  <SelectTrigger data-testid="select-judge">
                    <SelectValue placeholder="Choose a judge..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eventJudges.map((judge) => (
                      <SelectItem key={judge.id} value={String(judge.id)}>
                        {judge.name} ({judge.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  data-testid="textarea-message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={sendNotificationMutation.isPending}
                data-testid="button-send-message"
              >
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages or judges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-messages"
          />
        </div>
        <Badge variant="secondary">{myNotifications.length} total messages</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{myNotifications.length}</div>
            <p className="text-sm text-muted-foreground">Total Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">
              {myNotifications.filter((n) => n.isRead).length}
            </div>
            <p className="text-sm text-muted-foreground">Read</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">
              {myNotifications.filter((n) => !n.isRead).length}
            </div>
            <p className="text-sm text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
      </div>

      {sortedJudgeIds.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-2 border-muted p-12 text-center">
          <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold">No Messages Yet</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "No messages match your search." : "Send your first message to get started."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedJudgeIds.map((judgeId) => {
            const judge = getJudgeById(judgeId);
            const messages = groupedByJudge[judgeId];
            const unreadCount = messages.filter((m) => !m.isRead).length;

            return (
              <Card key={judgeId} data-testid={`card-judge-messages-${judgeId}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span>{judge?.name || `Judge ${judgeId}`}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{messages.length} messages</Badge>
                      {unreadCount > 0 && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                          {unreadCount} unread
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {messages.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg ${
                            notification.isRead ? "bg-muted/50" : "bg-primary/5 border border-primary/20"
                          }`}
                          data-testid={`message-${notification.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm flex-1">{notification.message}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              {notification.isRead ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.createdAt
                              ? format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")
                              : "Unknown date"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
