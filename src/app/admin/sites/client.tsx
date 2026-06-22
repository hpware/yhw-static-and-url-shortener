"use client";
import { Button } from "@/components/ui/button";
import { Globe, Trash2, Plus, ExternalLink, Copy, Upload, File, X, FolderOpen } from "lucide-react";
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
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { LoadingDots } from "@/components/ai/loading-dots";
import Table from "@/components/table";

export default function SitesClient() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: "", slug: "" });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [siteSlug, setSiteSlug] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("name", siteName);
      fd.append("slug", siteSlug);
      selectedFiles.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/sites/create", { method: "POST", body: fd });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("Site created");
      setCreateOpen(false);
      resetForm();
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

  const resetForm = () => {
    setSiteName("");
    setSiteSlug("");
    setSelectedFiles([]);
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
    if (name.endsWith(".css")) return "css";
    if (name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".tsx")) return "js";
    if (name.endsWith(".json")) return "json";
    if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return "img";
    return "file";
  };

  return (
    <div className="space-y-4 p-4">
      {/* Delete Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(s) => setDeleteConfirm({ ...deleteConfirm, open: s })}>
        <DialogContent>
          <DialogTitle>Delete Site</DialogTitle>
          <p>Delete <strong>{deleteConfirm.slug}</strong> and all its files and analytics?</p>
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
        <Dialog open={createOpen} onOpenChange={(s) => { setCreateOpen(s); if (!s) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="group"><Plus className="group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300" />Create Site</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogTitle>Create Site</DialogTitle>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Site Name</Label>
                  <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="My Site" />
                </div>
                <div className="space-y-1">
                  <Label>Slug</Label>
                  <Input value={siteSlug} onChange={(e) => setSiteSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} placeholder="my-site" />
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles((prev) => [...prev, ...files]);
                  }}
                />
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragging ? "Drop files here" : "Drop files or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">HTML, CSS, JS, images, fonts, etc.</p>
              </div>

              {/* File List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  <div className="text-sm text-muted-foreground mb-1">{selectedFiles.length} file(s)</div>
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b py-1.5 px-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {f.size < 1024 ? `${f.size}B` : f.size < 1048576 ? `${(f.size / 1024).toFixed(1)}KB` : `${(f.size / 1048576).toFixed(1)}MB`}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !siteName || !siteSlug || selectedFiles.length === 0}>
                  {createMutation.isPending ? <><LoadingDots /> Creating...</> : "Create Site"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><LoadingDots /></div>
      ) : data?.length > 0 ? (
        <Table
          key="sites_table"
          columns={[
            { accessorKey: "name", header: () => <span>Name</span>, cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
            {
              accessorKey: "slug", header: () => <span>URL</span>,
              cell: ({ row }) => (
                <a href={`${siteUrl}/${row.original.slug}`} target="_blank" className="text-blue-400 hover:underline flex items-center gap-1">
                  /{row.original.slug} <ExternalLink className="w-3 h-3" />
                </a>
              ),
            },
            { accessorKey: "totalVisits", header: () => <span>Visits</span>, cell: ({ row }) => <span>{row.original.totalVisits || 0}</span> },
            { accessorKey: "todayVisits", header: () => <span>Today</span>, cell: ({ row }) => <span>{row.original.todayVisits || 0}</span> },
            {
              accessorKey: "id", header: () => <span>Actions</span>,
              cell: ({ row }) => {
                if (!row?.original) return null;
                return (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => {
                      const url = `${window.location.origin}/api/tracking?site_id=${row.original.id}`;
                      navigator.clipboard.writeText(`<img src="${url}" width="1" height="1" style="display:none" />`);
                      toast.success("Tracking pixel copied");
                    }}><Copy className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm({ open: true, id: row.original.id, slug: row.original.slug })}>
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
