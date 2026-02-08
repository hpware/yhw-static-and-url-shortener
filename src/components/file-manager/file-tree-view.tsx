"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  FolderOpen,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileTreeNode } from "@/lib/s3";

interface FileTreeViewProps {
  nodes: FileTreeNode[];
  siteId: string;
  onDelete: (path: string, isFolder: boolean) => void;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function TreeNode({
  node,
  siteId,
  depth,
  onDelete,
}: {
  node: FileTreeNode;
  siteId: string;
  depth: number;
  onDelete: (path: string, isFolder: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);

  const isFolder = node.type === "folder";

  return (
    <div>
      <div
        className="group flex items-center gap-1 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isFolder && setExpanded(!expanded)}
      >
        {/* Expand/collapse icon */}
        {isFolder ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* File/folder icon */}
        {isFolder ? (
          expanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          )
        ) : (
          <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Name */}
        <span className="truncate flex-1">{node.name}</span>

        {/* Size */}
        {!isFolder && node.size !== undefined && (
          <span className="text-xs text-muted-foreground shrink-0 mr-2">
            {formatSize(node.size)}
          </span>
        )}

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
          {!isFolder && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                // Download the file
                window.open(
                  `/api/sites/${siteId}/files/${node.path}`,
                  "_blank"
                );
              }}
              title="Download"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.path, isFolder);
            }}
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              siteId={siteId}
              depth={depth + 1}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTreeView({
  nodes,
  siteId,
  onDelete,
}: FileTreeViewProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground text-sm">
        No files yet. Upload files to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-2">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          siteId={siteId}
          depth={0}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
