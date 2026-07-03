import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// GET /api/reviews?targetId=xxx — fetch all reviews for a user
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const jobId = searchParams.get("jobId");

  if (!targetId && !jobId) {
    return NextResponse.json(
      { error: "Provide targetId or jobId" },
      { status: 400 }
    );
  }

  const where = jobId ? { jobId } : { targetId };

  const reviews = await prisma.review.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { id: true, name: true, imageUrl: true } },
      job: { select: { id: true, title: true } },
    },
  });

  // Calculate aggregate stats
  const stats =
    reviews.length > 0
      ? {
          average:
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
          total: reviews.length,
          distribution: [1, 2, 3, 4, 5].map((star) => ({
            star,
            count: reviews.filter((r) => r.rating === star).length,
          })),
        }
      : null;

  return NextResponse.json({ reviews, stats });
}

// POST /api/reviews — submit a review
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId, rating, comment } = await req.json();

    if (!jobId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating (1-5 required)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the job is completed and user was part of it
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        bids: {
          where: { status: "accepted" },
          select: { bidderId: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "completed") {
      return NextResponse.json(
        { error: "Job must be completed before reviewing" },
        { status: 400 }
      );
    }

    const isPoster = job.posterId === user.id;
    const isAcceptedBidder = job.bids.some((b) => b.bidderId === user.id);

    if (!isPoster && !isAcceptedBidder) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Determine the target (the other person)
    const targetId = isPoster ? job.bids[0]?.bidderId : job.posterId;

    if (!targetId) {
      return NextResponse.json(
        { error: "No conversation partner found" },
        { status: 400 }
      );
    }

    // Check if already reviewed
    const existing = await prisma.review.findUnique({
      where: { jobId_reviewerId: { jobId, reviewerId: user.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You've already reviewed this job" },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        jobId,
        reviewerId: user.id,
        targetId,
      },
      include: {
        reviewer: { select: { id: true, name: true, imageUrl: true } },
        job: { select: { id: true, title: true } },
      },
    });

    // Notify the target user about the review
    try {
      const starLabel = "⭐".repeat(rating);
      await prisma.notification.create({
        data: {
          userId: targetId,
          type: "review_received",
          message: `${user.name} left you a ${rating}-star review on "${job.title}" ${starLabel}`,
          link: `/profile/${targetId}`,
        },
      });
    } catch (e) {
      console.error("Failed to create review notification:", e);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
