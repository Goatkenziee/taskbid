import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// GET /api/messages?jobId=xxx — fetch all messages for a job
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify the user is part of this job (poster or bidder with accepted bid)
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

  const isPoster = job.posterId === user.id;
  const isAcceptedBidder = job.bids.some((b) => b.bidderId === user.id);

  if (!isPoster && !isAcceptedBidder) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  // Mark unread messages as read
  const unreadIds = messages
    .filter((m) => !m.read && m.receiverId === user.id)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: unreadIds } },
      data: { read: true },
    });
  }

  return NextResponse.json({ messages, userId: user.id });
}

// POST /api/messages — send a message
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId, content } = await req.json();

    if (!jobId || !content?.trim()) {
      return NextResponse.json({ error: "Missing jobId or content" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is part of this job
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

    const isPoster = job.posterId === user.id;
    const isAcceptedBidder = job.bids.some((b) => b.bidderId === user.id);

    if (!isPoster && !isAcceptedBidder) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Determine the receiver
    const receiverId = isPoster
      ? job.bids[0]?.bidderId
      : job.posterId;

    if (!receiverId) {
      return NextResponse.json({ error: "No conversation partner found" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        jobId,
        senderId: user.id,
        receiverId,
      },
      include: {
        sender: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    // Create notification for the receiver about the new message
    try {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true },
      });
      if (receiver) {
        await prisma.notification.create({
          data: {
            userId: receiverId,
            type: "new_message",
            message: `${user.name} sent you a message about "${job.title}"`,
            link: `/messages/${jobId}`,
          },
        });
      }
    } catch (e) {
      console.error("Failed to create message notification:", e);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
