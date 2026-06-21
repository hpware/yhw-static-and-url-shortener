"use client";
import { Button } from "@/components/ui/button";
import { Key, Trash2, Plus, Copy, Download, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LoadingDots } from "@/components/ai/loading-dots";
import Table from "@/components/table";

export default function ApiKeysClient() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false, id: "", name: "",
  });
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/keys");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.keys;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.apiKey;
    },
    onSuccess: (data) => {
      toast.success("API key created");
      setNewKeyVisible(data.key);
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("Key deleted");
      setDeleteConfirm({ open: false, id: "", name: "" });
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadAgentMd = async () => {
    const res = await fetch("/api/keys/agent-md");
    const text = await res.text();
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("agent.md downloaded");
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* New Key Alert */}
      {newKeyVisible && (
        <div className="border border-green-500 bg-green-500/10 rounded-lg p-4">
          <h3 className="font-semibold text-green-400 mb-2">New API Key Created</h3>
          <p className="text-sm mb-2">Copy this key now - it won&apos;t be shown again:</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-black/30 p-2 rounded text-sm break-all">{newKeyVisible}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(newKeyVisible);
                toast.success("Copied");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewKeyVisible(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={(s) => setDeleteConfirm({ ...deleteConfirm, open: s })}>
        <DialogContent>
          <DialogTitle>Delete API Key</DialogTitle>
          <p>Delete key <strong>{deleteConfirm.name}</strong>? Applications using this key will stop working.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: "", name: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="group" onClick={downloadAgentMd}>
            <Download className="group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300 w-4 h-4" />
            Download agent.md
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="group">
                <Plus className="group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Create API Key</DialogTitle>
              <form
                className="flex flex-col space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target as HTMLFormElement);
                  createMutation.mutate(fd.get("name") as string);
                }}
              >
                <Label htmlFor="name">Key Name</Label>
                <Input type="text" id="name" name="name" required placeholder="My App" />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><LoadingDots /></div>
      ) : data?.length > 0 ? (
        <Table
          key="api_keys_table"
          columns={[
            {
              accessorKey: "name",
              header: () => <span>Name</span>,
              cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
            },
            {
              accessorKey: "key",
              header: () => <span>Key</span>,
              cell: ({ row }) => {
                const id = row.original.id;
                const visible = visibleKeys.has(id);
                return (
                  <div className="flex items-center gap-2">
                    <code className="text-xs">
                      {visible ? row.original.key : `${row.original.key.slice(0, 8)}${"*".repeat(24)}`}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(id)}>
                      {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(row.original.key);
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                );
              },
            },
            {
              accessorKey: "lastUsedAt",
              header: () => <span>Last Used</span>,
              cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                  {row.original.lastUsedAt ? new Date(row.original.lastUsedAt).toLocaleString() : "Never"}
                </span>
              ),
            },
            {
              accessorKey: "createdAt",
              header: () => <span>Created</span>,
              cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                  {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
              ),
            },
            {
              accessorKey: "id",
              header: () => <span>Actions</span>,
              cell: ({ row }) => {
                if (!row?.original) return null;
                return (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm({ open: true, id: row.original.id, name: row.original.name })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                );
              },
            },
          ]}
          data={data || []}
        />
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No API keys yet. Create one to access the API programmatically.</p>
        </div>
      )}
    </div>
  );
}
