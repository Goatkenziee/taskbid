import { Navbar } from "@/components/navbar";
import { ChatBox } from "@/components/chat-box";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, DollarSign } from "lucide-react";

export default async function MessageThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      poster: { select: { id: true, name: true, imageUrl: true } },
      category: { select: { name: true } },
      bids: {
        where: { status: "accepted" },
        include: {
          bidder: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  if (!job) {
    redirect("/messages");
  }

  const isPoster = job.posterId === user.id;
  const isAcceptedBidder = job.bids.some((b) => b.bidderId === user.id);

  if (!isPoster && !isAcceptedBidder) {
    redirect("/messages");
  }

  const partner = isPoster ? job.bids[0]?.bidder : job.poster;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <Link
          href="/messages"
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Messages
        </Link>

        {/* Job info card */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{job.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.category.name}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                job.status === "in_progress"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : job.status === "completed"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {job.status.replace("_", " ")}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              ${job.budgetMin} – ${job.budgetMax}
            </span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Partner info */}
          {partner && (
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {partner.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-medium">
                  Chatting with {partner.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPoster
                    ? "The pro working on your task"
                    : "The person who posted this task"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Box */}
        <ChatBox jobId={job.id} jobTitle={job.title} />
      </main>
    </>
  );
}
