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
    const jobId = formData.get("jobId") as string;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.posterId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (job.status !== "in_progress") {
      return NextResponse.json({ error: "Job is not in progress" }, { status: 400 });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "completed" },
    });

    return NextResponse.redirect(new URL(`/jobs/${jobId}`, req.url));
  } catch (error) {
    console.error("Error completing job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
