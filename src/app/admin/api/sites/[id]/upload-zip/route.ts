import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { putObject, deleteFolder } from "@/lib/s3";
import { getMimeType } from "@/lib/mime";
import JSZip from "jszip";

type Props = { params: Promise<{ id: string }> };

// POST: Upload ZIP file, extract and upload to S3
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
    const zipFile = formData.get("file") as File;
    const mode = (formData.get("mode") as string) || "merge";

    if (!zipFile) {
      return NextResponse.json(
        { error: "No ZIP file provided" },
        { status: 400 }
      );
    }

    if (
      !zipFile.name.endsWith(".zip") &&
      zipFile.type !== "application/zip" &&
      zipFile.type !== "application/x-zip-compressed"
    ) {
      return NextResponse.json(
        { error: "File must be a ZIP archive" },
        { status: 400 }
      );
    }

    const prefix = site.fsPath + "/";

    // If replace mode, delete all existing files first
    if (mode === "replace") {
      await deleteFolder(prefix);
    }

    // Read and extract ZIP
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBuffer);

    const uploaded: string[] = [];
    const errors: string[] = [];

    // Process each file in the ZIP
    const entries = Object.entries(zip.files);

    for (const [relativePath, zipEntry] of entries) {
      // Skip directories and macOS resource fork files
      if (
        zipEntry.dir ||
        relativePath.startsWith("__MACOSX") ||
        relativePath.includes(".DS_Store")
      ) {
        continue;
      }

      try {
        const content = await zipEntry.async("nodebuffer");
        const filename = relativePath.split("/").pop() || relativePath;
        const contentType = getMimeType(filename);
        const s3Key = `${prefix}${relativePath}`.replace(/\/+/g, "/");

        await putObject(s3Key, content, contentType);
        uploaded.push(relativePath);
      } catch (err) {
        console.error(`Error extracting ${relativePath}:`, err);
        errors.push(relativePath);
      }
    }

    return NextResponse.json({
      uploaded,
      errors,
      count: uploaded.length,
      errorCount: errors.length,
    });
  } catch (error) {
    console.error("Error processing ZIP:", error);
    return NextResponse.json(
      { error: "Failed to process ZIP file" },
      { status: 500 }
    );
  }
}
