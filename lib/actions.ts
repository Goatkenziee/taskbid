"use server";

import { prisma } from "./db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

async function createNotification(
  userId: string,
  type: string,
  message: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, message, link: link || null },
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getJobs(filters?: {
  categorySlug?: string;
  search?: string;
  status?: string;
  remote?: boolean;
  urgent?: boolean;
}) {
  const where: any = {};

  if (filters?.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters?.status) {
    where.status = filters.status;
  } else {
    where.status = "open";
  }
  if (filters?.remote) {
    where.isRemote = true;
  }
  if (filters?.urgent) {
    where.urgent = true;
  }

  return prisma.job.findMany({
    where,
    include: {
      poster: { select: { id: true, name: true, imageUrl: true } },
      category: true,
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      poster: {
        select: { id: true, name: true, imageUrl: true, createdAt: true },
      },
      category: true,
      bids: {
        include: {
          bidder: { select: { id: true, name: true, imageUrl: true } },
        },
        orderBy: { amount: "asc" },
      },
      _count: { select: { bids: true } },
    },
  });
}

export async function createJob(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const budgetMin = parseFloat(formData.get("budgetMin") as string);
  const budgetMax = parseFloat(formData.get("budgetMax") as string);
  const categoryId = formData.get("categoryId") as string;
  const location = formData.get("location") as string;
  const isRemote = formData.get("isRemote") === "on";
  const urgent = formData.get("urgent") === "on";
  const deadline = formData.get("deadline") as string;

  const job = await prisma.job.create({
    data: {
      title,
      description,
      budgetMin,
      budgetMax,
      categoryId,
      location: location || null,
      isRemote,
      urgent,
      deadline: deadline ? new Date(deadline) : null,
      posterId: user.id,
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return job;
}

export async function submitBid(jobId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const timeline = formData.get("timeline") as string;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { posterId: true, title: true },
  });
  if (!job) throw new Error("Job not found");

  await prisma.bid.upsert({
    where: { jobId_bidderId: { jobId, bidderId: user.id } },
    update: { amount, description, timeline, status: "pending" },
    create: {
      amount,
      description,
      timeline,
      jobId,
      bidderId: user.id,
    },
  });

  // Notify the job poster
  await createNotification(
    job.posterId,
    "bid_placed",
    `${user.name} placed a bid of $${amount} on your task "${job.title}"`,
    `/jobs/${jobId}`
  );

  revalidatePath(`/jobs/${jobId}`);
}

export async function acceptBid(bidId: string, jobId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { poster: true },
  });
  if (!job || job.posterId !== user.id) throw new Error("Not authorized");

  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { bidder: true },
  });
  if (!bid) throw new Error("Bid not found");

  await prisma.$transaction([
    prisma.bid.update({
      where: { id: bidId },
      data: { status: "accepted" },
    }),
    prisma.bid.updateMany({
      where: { jobId, id: { not: bidId } },
      data: { status: "rejected" },
    }),
    prisma.job.update({
      where: { id: jobId },
      data: { status: "in_progress" },
    }),
  ]);

  // Notify the winning bidder
  await createNotification(
    bid.bidderId,
    "bid_accepted",
    `Your bid on "${job.title}" was accepted! The task is now in progress.`,
    `/jobs/${jobId}`
  );

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function completeJob(jobId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      bids: {
        where: { status: "accepted" },
        include: { bidder: true },
      },
    },
  });
  if (!job || job.posterId !== user.id) throw new Error("Not authorized");

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "completed" },
  });

  // Notify the accepted bidder
  if (job.bids.length > 0) {
    await createNotification(
      job.bids[0].bidderId,
      "job_completed",
      `"${job.title}" has been marked as completed. Leave a review for the task poster!`,
      `/jobs/${jobId}`
    );
  }

  revalidatePath("/dashboard");
}

export async function getMyJobs() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return [];

  return prisma.job.findMany({
    where: { posterId: user.id },
    include: {
      category: true,
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyBids() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return [];

  return prisma.bid.findMany({
    where: { bidderId: user.id },
    include: {
      job: {
        include: {
          poster: { select: { id: true, name: true, imageUrl: true } },
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
