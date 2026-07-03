import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Support fetching by clerkId or internal id
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { clerkId: userId }],
      },
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        imageUrl: true,
        bio: true,
        location: true,
        createdAt: true,
        _count: {
          select: { reviewsReceived: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get average rating from reviews
    const reviews = await prisma.review.findMany({
      where: { targetId: user.id },
      select: { rating: true },
    });

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    // Count completed jobs as a bidder
    const completedJobs = await prisma.job.count({
      where: {
        bids: {
          some: {
            bidderId: user.id,
            status: "accepted",
          },
        },
        status: "completed",
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        bio: user.bio,
        location: user.location,
        createdAt: user.createdAt,
        completedJobs,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
