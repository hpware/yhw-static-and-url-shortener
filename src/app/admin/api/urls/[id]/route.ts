import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import { shortenerData, shortenerAnalytics } from "@/components/drizzle/schema";
import { eq, count } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";

type Props = { params: Promise<{ id: string }> };

// GET: Get single URL details with analytics count
export async function GET(req: NextRequest, { params }: Props) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get URL
    const url = await db.query.shortenerData.findFirst({
      where: eq(shortenerData.id, id),
    });

    if (!url) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Get analytics count
    const [analyticsResult] = await db
      .select({ count: count() })
      .from(shortenerAnalytics)
      .where(eq(shortenerAnalytics.refId, id));

    return NextResponse.json({
      ...url,
      visitCount: analyticsResult?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch URL" },
      { status: 500 }
    );
  }
}

// PATCH: Update URL
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, slug, destination } = body;

    // Check if URL exists
    const existing = await db.query.shortenerData.findFirst({
      where: eq(shortenerData.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Validate slug if provided
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

      // Check if new slug is unique (excluding current URL)
      if (slug !== existing.slug) {
        const duplicateSlug = await db.query.shortenerData.findFirst({
          where: eq(shortenerData.slug, slug),
        });

        if (duplicateSlug) {
          return NextResponse.json(
            { error: "Slug already exists" },
            { status: 400 }
          );
        }
      }
    }

    // Validate destination if provided
    if (destination) {
      try {
        new URL(destination);
      } catch {
        return NextResponse.json(
          { error: "Invalid destination URL" },
          { status: 400 }
        );
      }
    }

    // Update the URL
    const [updatedUrl] = await db
      .update(shortenerData)
      .set({
        ...(name && { name }),
        ...(slug && { slug }),
        ...(destination && { destination }),
        updatedBy: session.user.id,
      })
      .where(eq(shortenerData.id, id))
      .returning();

    return NextResponse.json(updatedUrl);
  } catch (error) {
    console.error("Error updating URL:", error);
    return NextResponse.json(
      { error: "Failed to update URL" },
      { status: 500 }
    );
  }
}

// DELETE: Delete URL and its analytics
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if URL exists
    const existing = await db.query.shortenerData.findFirst({
      where: eq(shortenerData.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Delete analytics first (foreign key constraint)
    await db
      .delete(shortenerAnalytics)
      .where(eq(shortenerAnalytics.refId, id));

    // Delete the URL
    await db.delete(shortenerData).where(eq(shortenerData.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting URL:", error);
    return NextResponse.json(
      { error: "Failed to delete URL" },
      { status: 500 }
    );
  }
}
