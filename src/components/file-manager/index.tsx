"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Archive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileTreeView from "./file-tree-view";
import FileUploadZone from "./file-upload-zone";
import ZipUploadDialog from "./zip-upload-dialog";
import type { FileTreeNode } from "@/lib/s3";

interface FileManagerProps {
  siteId: string;
}

interface FilesResponse {
  tree: FileTreeNode[];
  files: {
    key: string;
    path: string;
    size: number;
    lastModified: string;
  }[];
  prefix: string;
}

async function fetchFiles(siteId: string): Promise<FilesResponse> {
  const res = await fetch(`/api/sites/${siteId}/files`);
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export default function FileManager({ siteId }: FileManagerProps) {
  const queryClient = useQueryClient();
  const [zipDialogOpen, setZipDialogOpen] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["files", siteId],
    queryFn: () => fetchFiles(siteId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["files", siteId] });
  };

  const handleDelete = async (path: string, isFolder: boolean) => {
    const confirm = window.confirm(
      `Are you sure you want to delete ${isFolder ? "this folder and all its contents" : "this file"}?`
    );
    if (!confirm) return;

    try {
      const url = `/api/sites/${siteId}/files/${path}${isFolder ? "?folder=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Delete failed");
      }
      toast.success(isFolder ? "Folder deleted" : "File deleted");
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed"
      );
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">
          Error loading files: {error.message}
        </p>
      </div>
    );
  }

  const totalSize = data?.files.reduce((sum, f) => sum + f.size, 0) || 0;
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {data
            ? `${data.files.length} files, ${formatSize(totalSize)} total`
            : "Loading..."}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadZone(!showUploadZone)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZipDialogOpen(true)}
          >
            <Archive className="mr-2 h-4 w-4" />
            Upload ZIP
          </Button>
        </div>
      </div>

      {/* Upload zone (toggleable) */}
      {showUploadZone && (
        <FileUploadZone
          siteId={siteId}
          currentPath=""
          onUploadComplete={refresh}
        />
      )}

      {/* File tree */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p className="text-muted-foreground">Loading files...</p>
        </div>
      ) : (
        <FileTreeView
          nodes={data?.tree || []}
          siteId={siteId}
          onDelete={handleDelete}
        />
      )}

      {/* ZIP upload dialog */}
      <ZipUploadDialog
        siteId={siteId}
        open={zipDialogOpen}
        onOpenChange={setZipDialogOpen}
        onUploadComplete={refresh}
      />
    </div>
  );
}
