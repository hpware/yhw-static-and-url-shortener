import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export { s3Client, BUCKET };

// Get object from S3
export async function getObject(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return s3Client.send(command);
}

// Put object to S3
export async function putObject(
  key: string,
  body: Buffer | Uint8Array | string | Readable,
  contentType?: string
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return s3Client.send(command);
}

// Upload large files with multipart upload
export async function uploadLargeFile(
  key: string,
  body: Buffer | Readable,
  contentType?: string
) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });

  return upload.done();
}

// Delete single object from S3
export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return s3Client.send(command);
}

// Delete folder (all objects with prefix) from S3
export async function deleteFolder(prefix: string) {
  // First, list all objects with the prefix
  const objects = await listObjects(prefix);

  if (objects.length === 0) {
    return { deleted: 0 };
  }

  // Delete in batches of 1000 (S3 limit)
  const batches: _Object[][] = [];
  for (let i = 0; i < objects.length; i += 1000) {
    batches.push(objects.slice(i, i + 1000));
  }

  let totalDeleted = 0;

  for (const batch of batches) {
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: batch.map((obj) => ({ Key: obj.Key })),
        Quiet: true,
      },
    });
    await s3Client.send(command);
    totalDeleted += batch.length;
  }

  return { deleted: totalDeleted };
}

// List objects with prefix
export async function listObjects(
  prefix: string,
  maxKeys?: number
): Promise<_Object[]> {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys || 1000,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      objects.push(...response.Contents);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken && (!maxKeys || objects.length < maxKeys));

  return maxKeys ? objects.slice(0, maxKeys) : objects;
}

// Get object metadata (head request)
export async function getObjectMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return s3Client.send(command);
}

// Check if object exists
export async function objectExists(key: string): Promise<boolean> {
  try {
    await getObjectMetadata(key);
    return true;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "name" in error &&
      error.name === "NotFound"
    ) {
      return false;
    }
    throw error;
  }
}

// Stream S3 object to Response
export async function streamToResponse(
  key: string,
  contentType: string,
  cacheControl?: string
): Promise<Response> {
  try {
    const response = await getObject(key);

    if (!response.Body) {
      return new Response("File not found", { status: 404 });
    }

    const headers: HeadersInit = {
      "Content-Type": contentType,
    };

    if (response.ContentLength) {
      headers["Content-Length"] = response.ContentLength.toString();
    }

    if (cacheControl) {
      headers["Cache-Control"] = cacheControl;
    }

    if (response.ETag) {
      headers["ETag"] = response.ETag;
    }

    if (response.LastModified) {
      headers["Last-Modified"] = response.LastModified.toUTCString();
    }

    // Convert the readable stream to a web ReadableStream
    const webStream = response.Body.transformToWebStream();

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "name" in error &&
      error.name === "NoSuchKey"
    ) {
      return new Response("File not found", { status: 404 });
    }
    throw error;
  }
}

// Build file tree structure from flat S3 object list
export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  lastModified?: Date;
  children?: FileTreeNode[];
}

export function buildFileTree(
  objects: _Object[],
  prefix: string
): FileTreeNode[] {
  const root: Map<string, FileTreeNode> = new Map();

  for (const obj of objects) {
    if (!obj.Key) continue;

    // Remove the prefix to get relative path
    const relativePath = obj.Key.slice(prefix.length);
    if (!relativePath) continue;

    const parts = relativePath.split("/").filter(Boolean);

    let currentMap = root;
    let currentPath = prefix;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += part + (i < parts.length - 1 ? "/" : "");

      if (!currentMap.has(part)) {
        const isFile = i === parts.length - 1;
        const node: FileTreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          ...(isFile && {
            size: obj.Size,
            lastModified: obj.LastModified,
          }),
          ...(!isFile && { children: [] }),
        };
        currentMap.set(part, node);
      }

      const existingNode = currentMap.get(part)!;
      if (existingNode.type === "folder" && existingNode.children) {
        // Convert children array to map for next iteration
        const childMap = new Map<string, FileTreeNode>();
        for (const child of existingNode.children) {
          childMap.set(child.name, child);
        }
        currentMap = childMap;
        // Update children array from map
        existingNode.children = Array.from(childMap.values());
      }
    }
  }

  // Convert map to array and sort (folders first, then alphabetically)
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((node) => {
        if (node.children) {
          node.children = sortNodes(node.children);
        }
        return node;
      });
  };

  return sortNodes(Array.from(root.values()));
}
