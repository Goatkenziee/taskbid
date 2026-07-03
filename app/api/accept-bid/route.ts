import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const bidId = formData.get("bidId") as string;
    const jobId = formData.get("jobId") as string;

    if (!bidId || !jobId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify the user owns this job
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.posterId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (job.status !== "open") {
      return NextResponse.json({ error: "Job is not open for bids" }, { status: 400 });
    }

    // Accept the bid and update job status in a transaction
    await prisma.$transaction([
      prisma.bid.update({
        where: { id: bidId },
        data: { status: "accepted" },
      }),
      // Reject all other pending bids
      prisma.bid.updateMany({
        where: { jobId, status: "pending", id: { not: bidId } },
        data: { status: "rejected" },
      }),
      prisma.job.update({
        where: { id: jobId },
        data: { status: "in_progress" },
      }),
    ]);

    return NextResponse.redirect(new URL(`/jobs/${jobId}`, req.url));
  } catch (error) {
    console.error("Error accepting bid:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
