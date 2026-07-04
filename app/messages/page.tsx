import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";

export default async function MessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  // Find all jobs where the user has either posted or has an accepted bid
  const postedJobs = await prisma.job.findMany({
    where: {
      posterId: user.id,
      status: { in: ["in_progress", "completed"] },
    },
    include: {
      poster: { select: { id: true, name: true, imageUrl: true } },
      bids: {
        where: { status: "accepted" },
        include: {
          bidder: { select: { id: true, name: true, imageUrl: true } },
        },
      },
      _count: {
        select: {
          messages: { where: { read: false, receiverId: user.id } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const biddedJobs = await prisma.job.findMany({
    where: {
      bids: {
        some: {
          bidderId: user.id,
          status: "accepted",
        },
      },
      status: { in: ["in_progress", "completed"] },
    },
    include: {
      poster: { select: { id: true, name: true, imageUrl: true } },
      bids: {
        where: { bidderId: user.id, status: "accepted" },
        include: {
          bidder: { select: { id: true, name: true, imageUrl: true } },
        },
      },
      _count: {
        select: {
          messages: { where: { read: false, receiverId: user.id } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Combine and deduplicate
  const seen = new Set<string>();
  const conversations = [...postedJobs, ...biddedJobs].filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="mt-1 text-muted-foreground">
            Chat with task partners about your jobs
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No conversations yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When a bid is accepted on one of your tasks, you can chat here.
            </p>
            <Link
              href="/jobs"
              className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((job) => {
              const partner =
                job.posterId === user.id
                  ? job.bids[0]?.bidder
                  : job.poster;

              const unreadCount = job._count.messages;

              return (
                <Link
                  key={job.id}
                  href={`/messages/${job.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card/80"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {partner?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {job.title}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      with {partner?.name || "Unknown"}
                    </p>
                  </div>

                  {/* Status + Arrow */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        job.status === "in_progress"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {job.status === "in_progress" ? "In Progress" : "Done"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
