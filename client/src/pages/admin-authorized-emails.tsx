import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Mail, Shield, Users, UserCog } from "lucide-react";

interface AuthorizedEmail {
  id: string;
  email: string;
  role: string;
  name: string | null;
  createdAt: string | null;
  createdBy: number | null;
}

export default function AdminAuthorizedEmails() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "judge",
    name: "",
  });

  const { data: user } = useQuery<{ role: string }>({
    queryKey: ["/api/user"],
  });

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const { data: authorizedEmails = [], isLoading } = useQuery<AuthorizedEmail[]>({
    queryKey: ["/api/authorized-emails"],
    enabled: isAdmin || isManager,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; role: string; name?: string }) => {
      return apiRequest("POST", "/api/authorized-emails", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/authorized-emails"] });
      toast({ title: "Email Added", description: "The email has been added to the authorized list." });
      setDialogOpen(false);
      setFormData({ email: "", role: "judge", name: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add email", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/authorized-emails/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/authorized-emails"] });
      toast({ title: "Email Removed", description: "The email has been removed from the authorized list." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove email", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.email.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      email: formData.email.trim(),
      role: formData.role,
      name: formData.name.trim() || undefined,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive" className="gap-1"><Shield className="w-3 h-3" />Admin</Badge>;
      case "manager":
        return <Badge variant="default" className="gap-1"><UserCog className="w-3 h-3" />Manager</Badge>;
      case "judge":
        return <Badge variant="secondary" className="gap-1"><Users className="w-3 h-3" />Judge</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-5 h-5 text-red-500" />;
      case "manager":
        return <UserCog className="w-5 h-5 text-blue-500" />;
      case "judge":
        return <Users className="w-5 h-5 text-gray-500" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const adminCount = authorizedEmails.filter(e => e.role === "admin").length;
  const managerCount = authorizedEmails.filter(e => e.role === "manager").length;
  const judgeCount = authorizedEmails.filter(e => e.role === "judge").length;

  if (!isAdmin && !isManager) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">You don't have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Authorized Emails</h1>
          <p className="text-muted-foreground">
            Manage email addresses that can log in with Google. Users with these emails will automatically get their assigned role.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-email">
              <Plus className="w-4 h-4 mr-2" />
              Add Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Authorized Email</DialogTitle>
              <DialogDescription>Add an email address that will be recognized when logging in with Google.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    {isAdmin && <SelectItem value="manager">Manager</SelectItem>}
                    <SelectItem value="judge">Judge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending}
                data-testid="button-submit-email"
              >
                {createMutation.isPending ? "Adding..." : "Add Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCount}</div>
            </CardContent>
          </Card>
        )}
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Managers</CardTitle>
              <UserCog className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{managerCount}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Judges</CardTitle>
            <Users className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judgeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email List</CardTitle>
          <CardDescription>
            {isManager ? "Judges you've authorized to log in with Google" : "All authorized emails for Google login"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : authorizedEmails.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No authorized emails yet.</p>
              <p className="text-sm">Add emails to allow users to log in with Google.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authorizedEmails.map((item) => (
                  <TableRow key={item.id} data-testid={`row-email-${item.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(item.role)}
                        {item.email}
                      </div>
                    </TableCell>
                    <TableCell>{item.name || "-"}</TableCell>
                    <TableCell>{getRoleBadge(item.role)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Remove ${item.email} from authorized list?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
