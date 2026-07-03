import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { jobId, amount, description, timeline } = await req.json();

    if (!jobId || !amount || !description || !timeline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify job exists and is open
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.status !== "open") {
      return NextResponse.json({ error: "This job is no longer accepting bids" }, { status: 400 });
    }
    if (job.posterId === user.id) {
      return NextResponse.json({ error: "You cannot bid on your own task" }, { status: 400 });
    }

    // Upsert bid (update if exists, create if not)
    const existingBid = await prisma.bid.findFirst({
      where: { jobId, bidderId: user.id },
    });

    let bid;
    if (existingBid) {
      bid = await prisma.bid.update({
        where: { id: existingBid.id },
        data: { amount: Number(amount), description, timeline },
      });
    } else {
      bid = await prisma.bid.create({
        data: {
          jobId,
          bidderId: user.id,
          amount: Number(amount),
          description,
          timeline,
        },
      });
    }

    return NextResponse.json(bid, { status: existingBid ? 200 : 201 });
  } catch (error) {
    console.error("Error placing bid:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
