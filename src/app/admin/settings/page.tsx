"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { LoadingDots } from "@/components/ai/loading-dots";
import { Trash2, UserPlus, Users, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsClient() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });

  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      return res.json();
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.users;
    },
  });

  const { data: indexData } = useQuery({
    queryKey: ["settings-index-redirect"],
    queryFn: async () => {
      const res = await fetch("/api/settings/index-redirect");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.url;
    },
  });

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  useEffect(() => {
    if (indexData !== undefined) setIndexUrl(indexData || "");
  }, [indexData]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => toast.success("Profile updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords don't match");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("User created");
      setCreateUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("User deleted");
      setDeleteConfirm({ open: false, id: "", name: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveIndexRedirect = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/index-redirect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: indexUrl || null }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => toast.success("Saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingDots /></div>;
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl">
      {/* Delete User Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(s) => setDeleteConfirm({ ...deleteConfirm, open: s })}>
        <DialogContent>
          <DialogTitle>Delete User</DialogTitle>
          <p>Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: "", name: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteUser.mutate(deleteConfirm.id)} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Settings</h1>
        <span className="text-muted-foreground text-xs border px-1.5 py-0.5 rounded">yhMv1</span>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="opacity-60" />
        </div>
        <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <div className="space-y-2">
          <Label>Current Password</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending || !currentPassword || !newPassword}>
          {changePassword.isPending ? "Changing..." : "Change Password"}
        </Button>
      </div>

      {/* User Management */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Users</h2>
          </div>
          <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="group">
                <UserPlus className="w-4 h-4 mr-1 group-hover:-rotate-5 group-hover:scale-110 transition-all" />Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Create User</DialogTitle>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Min 8 characters" />
                    <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
                  <Button onClick={() => createUser.mutate()} disabled={createUser.isPending || !newUserName || !newUserEmail || newUserPassword.length < 8}>
                    {createUser.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {usersData?.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between border-b py-2">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                {u.id !== session?.user?.id && (
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ open: true, id: u.id, name: u.name })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Shortener Root Redirect</h2>
        <p className="text-sm text-muted-foreground">Where visitors go when visiting the shortener root.</p>
        <div className="flex gap-2">
          <Input placeholder="https://example.com" value={indexUrl} onChange={(e) => setIndexUrl(e.target.value)} />
          <Button onClick={() => saveIndexRedirect.mutate()} disabled={saveIndexRedirect.isPending}>
            {saveIndexRedirect.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
