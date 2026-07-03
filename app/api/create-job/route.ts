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
    const { title, description, categoryId, budgetMin, budgetMax, location, isRemote, urgent, deadline } = await req.json();

    if (!title || !description || !categoryId || !budgetMin || !budgetMax) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        categoryId,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        location: location || null,
        isRemote: isRemote || false,
        urgent: urgent || false,
        deadline: deadline ? new Date(deadline) : null,
        posterId: user.id,
        status: "open",
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
