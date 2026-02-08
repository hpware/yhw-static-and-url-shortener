import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { eq, count } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { deleteFolder, listObjects } from "@/lib/s3";

type Props = { params: Promise<{ id: string }> };

// GET: Get single site details
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

    // Get analytics count
    const [analyticsResult] = await db
      .select({ count: count() })
      .from(siteAnalytics)
      .where(eq(siteAnalytics.siteId, id));

    // Get file count from S3
    let fileCount = 0;
    try {
      const objects = await listObjects(site.fsPath + "/");
      fileCount = objects.length;
    } catch {
      // S3 may not be configured yet
    }

    return NextResponse.json({
      ...site,
      visitCount: analyticsResult?.count || 0,
      fileCount,
    });
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

// PATCH: Update site metadata
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, slug } = body;

    const existing = await db.query.siteData.findFirst({
      where: eq(siteData.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (slug) {
      const slugRegex = /^[a-zA-Z0-9._-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          {
            error:
              "Slug can only contain letters, numbers, dots, hyphens, and underscores",
          },
          { status: 400 }
        );
      }

      if (slug !== existing.slug) {
        const duplicateSlug = await db.query.siteData.findFirst({
          where: eq(siteData.slug, slug),
        });

        if (duplicateSlug) {
          return NextResponse.json(
            { error: "Slug already exists" },
            { status: 400 }
          );
        }
      }
    }

    const [updatedSite] = await db
      .update(siteData)
      .set({
        ...(name && { name }),
        ...(slug && { slug }),
        updatedBy: session.user.id,
      })
      .where(eq(siteData.id, id))
      .returning();

    return NextResponse.json(updatedSite);
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

// DELETE: Delete site + all S3 files + analytics
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.query.siteData.findFirst({
      where: eq(siteData.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Delete S3 files
    try {
      await deleteFolder(existing.fsPath + "/");
    } catch (error) {
      console.error("Error deleting S3 files:", error);
    }

    // Delete analytics
    await db.delete(siteAnalytics).where(eq(siteAnalytics.siteId, id));

    // Delete site
    await db.delete(siteData).where(eq(siteData.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}
