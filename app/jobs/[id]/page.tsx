import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BidForm } from "@/components/bid-form";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { MapPin, Clock, DollarSign, Users, Calendar, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

function timeAgo(date: Date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      poster: { select: { id: true, name: true, imageUrl: true, createdAt: true } },
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

  if (!job) notFound();

  const { userId } = await auth();
  let currentUser: { id: string; clerkId: string } | null = null;
  if (userId) {
    currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, clerkId: true },
    });
  }

  const isPoster = currentUser?.id === job.posterId;
  const acceptedBid = job.bids.find((b) => b.status === "accepted");
  const userBid = job.bids.find((b) => b.bidderId === currentUser?.id);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link href="/jobs" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {job.urgent && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                    Urgent
                  </span>
                )}
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {job.category.name}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    job.status === "open"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : job.status === "in_progress"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {job.status === "open" ? "Open for Bids" : job.status === "in_progress" ? "In Progress" : "Completed"}
                </span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">{job.title}</h1>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">
                    ${job.budgetMin} – ${job.budgetMax}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {job._count.bids} bids
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Posted {timeAgo(job.createdAt)}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Due {job.deadline.toLocaleDateString()}
                  </span>
                )}
                {!job.isRemote && job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
                {job.isRemote && <span className="text-emerald-400">🌍 Remote</span>}
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <h2 className="mb-3 text-lg font-semibold">Description</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.description}
                </div>
              </div>

              {/* Poster info */}
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {job.poster.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{job.poster.name}</div>
                  <div className="text-xs text-muted-foreground">Task Poster</div>
                </div>
              </div>
            </Card>

            {/* Bids section */}
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold">
                Bids ({job.bids.length})
              </h2>

              {job.bids.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No bids yet. Be the first!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {job.bids.map((bid) => (
                    <Card
                      key={bid.id}
                      className={`p-5 ${
                        bid.status === "accepted"
                          ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                          : bid.status === "rejected"
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                            {bid.bidder.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{bid.bidder.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Timeline: {bid.timeline}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold gradient-text">${bid.amount}</div>
                          {bid.status === "accepted" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> Accepted
                            </span>
                          )}
                          {bid.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                              <XCircle className="h-3 w-3" /> Passed
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{bid.description}</p>

                      {/* Accept button — only poster sees this */}
                      {isPoster && bid.status === "pending" && job.status === "open" && (
                        <form action={`/api/accept-bid`} method="POST" className="mt-4">
                          <input type="hidden" name="bidId" value={bid.id} />
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button size="sm" variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                            Accept This Bid
                          </Button>
                        </form>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — bid form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {job.status === "open" && !isPoster && currentUser && !acceptedBid && (
                <BidForm jobId={job.id} existingBid={userBid ? {
                  amount: userBid.amount,
                  description: userBid.description,
                  timeline: userBid.timeline,
                } : undefined} />
              )}

              {job.status === "in_progress" && acceptedBid && (
                <Card className="p-5 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                  <p className="font-medium">Task In Progress</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A bid has been accepted for this task.
                  </p>
                  {isPoster && (
                    <form action={`/api/complete-job`} method="POST" className="mt-4">
                      <input type="hidden" name="jobId" value={job.id} />
                      <Button size="sm" className="w-full">
                        Mark as Completed
                      </Button>
                    </form>
                  )}
                </Card>
              )}

              {job.status === "completed" && (
                <Card className="p-5 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                  <p className="font-medium">Task Completed</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This task has been marked as done.
                  </p>
                </Card>
              )}

              {!currentUser && (
                <Card className="p-5 text-center">
                  <p className="text-sm text-muted-foreground">Sign in to place a bid on this task.</p>
                  <Link href="/sign-in">
                    <Button className="mt-3 w-full">Sign In</Button>
                  </Link>
                </Card>
              )}

              {isPoster && (
                <Card className="p-5">
                  <p className="text-sm font-medium">You posted this task</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review bids below and accept the best one.
                  </p>
                </Card>
              )}

              {job.status !== "open" && (
                <Card className="p-5 text-center">
                  <p className="text-sm text-muted-foreground">
                    This task is no longer accepting bids.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
