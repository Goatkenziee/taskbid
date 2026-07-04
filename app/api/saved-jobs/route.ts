import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// GET /api/saved-jobs — fetch saved jobs for the current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          category: { select: { name: true, icon: true } },
          poster: { select: { id: true, name: true, imageUrl: true } },
          _count: { select: { bids: true } },
        },
      },
    },
  });

  return NextResponse.json({ savedJobs });
}

// POST /api/saved-jobs — toggle save/un-save a job
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: user.id, jobId } },
    });

    if (existing) {
      // Un-save
      await prisma.savedJob.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ saved: false });
    } else {
      // Save
      await prisma.savedJob.create({
        data: { userId: user.id, jobId },
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error("Error toggling saved job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
