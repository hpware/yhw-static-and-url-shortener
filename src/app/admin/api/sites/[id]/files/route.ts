import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { listObjects, putObject, buildFileTree } from "@/lib/s3";
import { getMimeType } from "@/lib/mime";

type Props = { params: Promise<{ id: string }> };

// GET: List files in tree structure
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const site = await db.query.siteData.findFirst({
      where: eq(siteData.id, id),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const prefix = site.fsPath + "/";
    const objects = await listObjects(prefix);

    // Build tree structure
    const tree = buildFileTree(objects, prefix);

    // Also return flat list with metadata
    const files = objects
      .filter((obj) => obj.Key)
      .map((obj) => ({
        key: obj.Key!,
        path: obj.Key!.slice(prefix.length),
        size: obj.Size || 0,
        lastModified: obj.LastModified,
      }));

    return NextResponse.json({ tree, files, prefix });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}

// POST: Upload individual files (multipart/form-data)
export async function POST(req: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const site = await db.query.siteData.findFirst({
      where: eq(siteData.id, id),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const uploadPath = (formData.get("path") as string) || "";
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const prefix = site.fsPath + "/";
    const uploaded: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = uploadPath
        ? `${prefix}${uploadPath}/${file.name}`
        : `${prefix}${file.name}`;

      // Normalize path
      const normalizedPath = filePath.replace(/\/+/g, "/");
      const contentType = getMimeType(file.name);

      await putObject(normalizedPath, buffer, contentType);
      uploaded.push(normalizedPath);
    }

    return NextResponse.json({
      uploaded,
      count: uploaded.length,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
