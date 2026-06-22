import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: !!process.env.S3_ENDPOINT,
});

const BUCKET = process.env.S3_BUCKET || "yhw-sites";

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function getFile(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  try {
    const result = await s3.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    if (!result.Body) return null;
    const body = await result.Body.transformToByteArray();
    return { body, contentType: result.ContentType || "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function deleteSiteFiles(slug: string) {
  const prefix = `sites/${slug}/`;
  try {
    const listed = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    }));
    if (!listed.Contents || listed.Contents.length === 0) return;
    await s3.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: listed.Contents.map((obj) => ({ Key: obj.Key! })),
      },
    }));
  } catch (e) {
    console.error("S3 delete error:", e);
  }
}

export function getSitePrefix(slug: string) {
  return `sites/${slug}`;
}
