"use client";
import { Button } from "@/components/ui/button";
import { Globe, Trash2, Plus, ExternalLink, BarChart3, Copy } from "lucide-react";
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
import { useState, useRef } from "react";
import { toast } from "sonner";
import { LoadingDots } from "@/components/ai/loading-dots";
import Table from "@/components/table";

export default function SitesClient() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; slug: string }>({
    open: false, id: "", slug: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const { data, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetch("/api/sites/list");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.sites;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/sites/create", { method: "POST", body: formData });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("Site created");
      setCreateOpen(false);
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/sites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("Site deleted");
      setDeleteConfirm({ open: false, id: "", slug: "" });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4">
      <Dialog open={deleteConfirm.open} onOpenChange={(s) => setDeleteConfirm({ ...deleteConfirm, open: s })}>
        <DialogContent>
          <DialogTitle>Delete Site</DialogTitle>
          <p>Are you sure you want to delete <strong>{deleteConfirm.slug}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: "", slug: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sites</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="group">
              <Plus className="group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300" />
              Create Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Create a new site</DialogTitle>
            <form
              className="flex flex-col space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                selectedFiles.forEach((f) => fd.append("files", f));
                createMutation.mutate(fd);
              }}
            >
              <Label htmlFor="name">Site Name</Label>
              <Input type="text" id="name" name="name" required placeholder="My Site" />
              <Label htmlFor="slug">Slug</Label>
              <Input type="text" id="slug" name="slug" required placeholder="my-site" pattern="[\w-]+" />
              <Label htmlFor="files">Files</Label>
              <Input
                ref={fileInputRef}
                type="file"
                id="files"
                name="files"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              />
              {selectedFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length} file(s): {selectedFiles.map((f) => f.name).join(", ")}
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Site"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><LoadingDots /></div>
      ) : data?.length > 0 ? (
        <Table
          key="sites_table"
          columns={[
            {
              accessorKey: "name",
              header: () => <span>Name</span>,
              cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
            },
            {
              accessorKey: "slug",
              header: () => <span>URL</span>,
              cell: ({ row }) => (
                <a href={`${siteUrl}/${row.original.slug}`} target="_blank" className="text-blue-400 hover:underline flex items-center gap-1">
                  /{row.original.slug} <ExternalLink className="w-3 h-3" />
                </a>
              ),
            },
            {
              accessorKey: "totalVisits",
              header: () => <span>Visits</span>,
              cell: ({ row }) => <span>{row.original.totalVisits || 0}</span>,
            },
            {
              accessorKey: "todayVisits",
              header: () => <span>Today</span>,
              cell: ({ row }) => <span>{row.original.todayVisits || 0}</span>,
            },
            {
              accessorKey: "id",
              header: () => <span>Actions</span>,
              cell: ({ row }) => {
                if (!row?.original) return null;
                return (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const trackingUrl = `${window.location.origin}/api/tracking?site_id=${row.original.id}`;
                        navigator.clipboard.writeText(
                          `<img src="${trackingUrl}" width="1" height="1" style="display:none" />`
                        );
                        toast.success("Tracking pixel copied");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirm({ open: true, id: row.original.id, slug: row.original.slug })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={data || []}
        />
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No sites yet. Create your first site to get started.</p>
        </div>
      )}
    </div>
  );
}
