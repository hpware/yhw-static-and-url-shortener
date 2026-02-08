import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import { siteData, siteAnalytics } from "@/components/drizzle/schema";
import { desc, like, or, count, eq } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { listObjects } from "@/lib/s3";

// GET: List sites
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    const conditions = search
      ? or(
          like(siteData.name, `%${search}%`),
          like(siteData.slug, `%${search}%`)
        )
      : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(siteData)
      .where(conditions);

    const total = totalResult?.count || 0;

    const sites = await db
      .select()
      .from(siteData)
      .where(conditions)
      .orderBy(desc(siteData.createdAt))
      .limit(limit)
      .offset(offset);

    // Get file counts for each site from S3
    const sitesWithCounts = await Promise.all(
      sites.map(async (site) => {
        try {
          const objects = await listObjects(site.fsPath + "/");
          return { ...site, fileCount: objects.length };
        } catch {
          return { ...site, fileCount: 0 };
        }
      })
    );

    return NextResponse.json({
      sites: sitesWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

// POST: Create a new site
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

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

    // Check if slug is unique
    const existing = await db.query.siteData.findFirst({
      where: eq(siteData.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const fsPath = `sites/${id}`;

    const [newSite] = await db
      .insert(siteData)
      .values({
        id,
        name,
        slug,
        fsPath,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        qrCodePath: "",
      })
      .returning();

    return NextResponse.json(newSite, { status: 201 });
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
