import { NextRequest, NextResponse } from "next/server";
import { db } from "@/components/drizzle/db";
import { shortenerData } from "@/components/drizzle/schema";
import { eq, desc, like, or, sql, count } from "drizzle-orm";
import { auth } from "@/components/auth";
import { headers } from "next/headers";

// GET: List URLs with pagination and search
export async function GET(req: NextRequest) {
  try {
    // Check authentication
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

    // Build query conditions
    const conditions = search
      ? or(
          like(shortenerData.name, `%${search}%`),
          like(shortenerData.slug, `%${search}%`),
          like(shortenerData.destination, `%${search}%`)
        )
      : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(shortenerData)
      .where(conditions);

    const total = totalResult?.count || 0;

    // Get paginated URLs
    const urls = await db
      .select()
      .from(shortenerData)
      .where(conditions)
      .orderBy(desc(shortenerData.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      urls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return NextResponse.json(
      { error: "Failed to fetch URLs" },
      { status: 500 }
    );
  }
}

// POST: Create a new URL
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, destination } = body;

    // Validate required fields
    if (!name || !slug || !destination) {
      return NextResponse.json(
        { error: "Name, slug, and destination are required" },
        { status: 400 }
      );
    }

    // Validate slug format
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
    const existing = await db.query.shortenerData.findFirst({
      where: eq(shortenerData.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    // Validate destination URL
    try {
      new URL(destination);
    } catch {
      return NextResponse.json(
        { error: "Invalid destination URL" },
        { status: 400 }
      );
    }

    // Create the URL
    const [newUrl] = await db
      .insert(shortenerData)
      .values({
        name,
        slug,
        destination,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        qrCodePath: "", // Will be generated later if needed
      })
      .returning();

    return NextResponse.json(newUrl, { status: 201 });
  } catch (error) {
    console.error("Error creating URL:", error);
    return NextResponse.json(
      { error: "Failed to create URL" },
      { status: 500 }
    );
  }
}
