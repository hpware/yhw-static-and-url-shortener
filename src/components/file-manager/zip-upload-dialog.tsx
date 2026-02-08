"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ZipUploadDialogProps {
  siteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

export default function ZipUploadDialog({
  siteId,
  open,
  onOpenChange,
  onUploadComplete,
}: ZipUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress("Extracting and uploading files...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch(`/api/sites/${siteId}/upload-zip`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await res.json();
      setProgress(
        `Done! Uploaded ${result.count} file(s)${
          result.errorCount > 0
            ? `, ${result.errorCount} error(s)`
            : ""
        }`
      );
      setFile(null);
      onUploadComplete();

      // Close after a delay so user can see the result
      setTimeout(() => {
        onOpenChange(false);
        setProgress("");
      }, 1500);
    } catch (error) {
      setProgress(
        `Error: ${error instanceof Error ? error.message : "Upload failed"}`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload ZIP Archive</DialogTitle>
          <DialogDescription>
            Upload a ZIP file to extract and deploy its contents to this site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zip-file">ZIP File</Label>
            <input
              id="zip-file"
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Mode</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="merge"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                  className="accent-primary"
                />
                Merge (keep existing files)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  className="accent-primary"
                />
                Replace all files
              </label>
            </div>
            {mode === "replace" && (
              <p className="text-xs text-destructive">
                Warning: This will delete all existing files before uploading.
              </p>
            )}
          </div>

          {progress && (
            <p className="text-sm text-muted-foreground">{progress}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Processing..." : "Upload & Extract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
