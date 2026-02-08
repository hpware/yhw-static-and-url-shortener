"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
  siteId: string;
  currentPath: string;
  onUploadComplete: () => void;
}

export default function FileUploadZone({
  siteId,
  currentPath,
  onUploadComplete,
}: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(`Uploading ${selectedFiles.length} file(s)...`);

    try {
      const formData = new FormData();
      if (currentPath) {
        formData.append("path", currentPath);
      }
      for (const file of selectedFiles) {
        formData.append("files", file);
      }

      const res = await fetch(`/api/sites/${siteId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await res.json();
      setProgress(`Uploaded ${result.count} file(s) successfully`);
      setSelectedFiles([]);
      onUploadComplete();
    } catch (error) {
      setProgress(
        `Error: ${error instanceof Error ? error.message : "Upload failed"}`
      );
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm text-primary">Drop files here...</p>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Drag & drop files here, or click to select
            </p>
            {currentPath && (
              <p className="text-xs text-muted-foreground mt-1">
                Uploading to: {currentPath}/
              </p>
            )}
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="max-h-40 overflow-y-auto space-y-1">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {formatSize(file.size)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selectedFiles.length} file(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFiles([])}
                disabled={uploading}
              >
                Clear
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {progress && (
        <p className="text-xs text-muted-foreground">{progress}</p>
      )}
    </div>
  );
}
