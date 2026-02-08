"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShortUrl {
  id: string;
  name: string;
  slug: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
  qrCodePath: string;
}

interface UrlsResponse {
  urls: ShortUrl[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchUrls(
  page: number,
  search: string
): Promise<UrlsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(search && { search }),
  });
  const res = await fetch(`/api/urls?${params}`);
  if (!res.ok) throw new Error("Failed to fetch URLs");
  return res.json();
}

async function createUrl(data: {
  name: string;
  slug: string;
  destination: string;
}): Promise<ShortUrl> {
  const res = await fetch("/api/urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create URL");
  }
  return res.json();
}

async function updateUrl(
  id: string,
  data: { name?: string; slug?: string; destination?: string }
): Promise<ShortUrl> {
  const res = await fetch(`/api/urls/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update URL");
  }
  return res.json();
}

async function deleteUrl(id: string): Promise<void> {
  const res = await fetch(`/api/urls/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete URL");
  }
}

export default function UrlsClient() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<ShortUrl | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDestination, setFormDestination] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["urls", page, search],
    queryFn: () => fetchUrls(page, search),
  });

  const createMutation = useMutation({
    mutationFn: createUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      setCreateDialogOpen(false);
      resetForm();
      toast.success("URL created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUrl>[1] }) =>
      updateUrl(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      setEditDialogOpen(false);
      setSelectedUrl(null);
      resetForm();
      toast.success("URL updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      setDeleteDialogOpen(false);
      setSelectedUrl(null);
      toast.success("URL deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormDestination("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formName,
      slug: formSlug,
      destination: formDestination,
    });
  };

  const handleEdit = (url: ShortUrl) => {
    setSelectedUrl(url);
    setFormName(url.name);
    setFormSlug(url.slug);
    setFormDestination(url.destination);
    setEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUrl) return;
    updateMutation.mutate({
      id: selectedUrl.id,
      data: {
        name: formName,
        slug: formSlug,
        destination: formDestination,
      },
    });
  };

  const handleDelete = (url: ShortUrl) => {
    setSelectedUrl(url);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUrl) return;
    deleteMutation.mutate(selectedUrl.id);
  };

  const copyToClipboard = (url: ShortUrl) => {
    const shortUrl = `${window.location.origin}/shortener/${url.slug}`;
    navigator.clipboard.writeText(shortUrl);
    toast.success("Short URL copied to clipboard");
  };

  const getShortUrl = (slug: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/shortener/${slug}`;
    }
    return `/shortener/${slug}`;
  };

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">Error loading URLs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">URL Shortener</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Create URL
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Short URL</DialogTitle>
              <DialogDescription>
                Create a new short URL that redirects to your destination.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="My Link"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="my-link"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, dots, hyphens, and underscores
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination URL</Label>
                <Input
                  id="destination"
                  type="url"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search URLs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : data?.urls.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {search ? "No URLs found matching your search" : "No URLs yet"}
          </p>
          {!search && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first URL
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Short URL</TableHead>
                  <TableHead className="hidden md:table-cell">Destination</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.urls.map((url) => (
                  <TableRow key={url.id}>
                    <TableCell className="font-medium">{url.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        /shortener/{url.slug}
                      </code>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <a
                        href={url.destination}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate max-w-xs inline-block"
                      >
                        {url.destination}
                      </a>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(url.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => copyToClipboard(url)}
                          title="Copy short URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => window.open(getShortUrl(url.slug), "_blank")}
                          title="Open short URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(url)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(url)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
                {Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )}{" "}
                of {data.pagination.total} URLs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit URL</DialogTitle>
            <DialogDescription>
              Update the short URL details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-destination">Destination URL</Label>
              <Input
                id="edit-destination"
                type="url"
                value={formDestination}
                onChange={(e) => setFormDestination(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete URL</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUrl?.name}"? This action
              cannot be undone. All analytics data for this URL will also be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
