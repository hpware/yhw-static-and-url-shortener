import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { getObject, deleteObject, deleteFolder } from "@/lib/s3";
import { getMimeType } from "@/lib/mime";

type Props = { params: Promise<{ id: string; path: string[] }> };

// GET: Download a file
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, path: pathParts } = await params;
    const filePath = pathParts.join("/");

    const site = await db.query.siteData.findFirst({
      where: eq(siteData.id, id),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const s3Key = `${site.fsPath}/${filePath}`;

    try {
      const response = await getObject(s3Key);

      if (!response.Body) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      const contentType = getMimeType(filePath);
      const stream = response.Body.transformToWebStream();

      return new Response(stream, {
        headers: {
          "Content-Type": contentType,
          ...(response.ContentLength && {
            "Content-Length": response.ContentLength.toString(),
          }),
          "Content-Disposition": `attachment; filename="${pathParts[pathParts.length - 1]}"`,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "name" in error &&
        error.name === "NoSuchKey"
      ) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a file or folder
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, path: pathParts } = await params;
    const filePath = pathParts.join("/");

    const site = await db.query.siteData.findFirst({
      where: eq(siteData.id, id),
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const s3Key = `${site.fsPath}/${filePath}`;

    // Check if it's a folder (delete prefix) or file
    const isFolder = req.nextUrl.searchParams.get("folder") === "true";

    if (isFolder) {
      const result = await deleteFolder(s3Key + "/");
      return NextResponse.json({ success: true, deleted: result.deleted });
    } else {
      await deleteObject(s3Key);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
