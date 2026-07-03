import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Briefcase, DollarSign, Clock, Star, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      postedJobs: {
        include: {
          category: true,
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      bids: {
        include: {
          job: {
            include: { category: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) redirect("/sign-in");

  const openJobs = user.postedJobs.filter((j) => j.status === "open").length;
  const inProgressJobs = user.postedJobs.filter((j) => j.status === "in_progress").length;
  const completedJobs = user.postedJobs.filter((j) => j.status === "completed").length;
  const totalBidsReceived = user.postedJobs.reduce((acc, j) => acc + j._count.bids, 0);

  const activeBids = user.bids.filter((b) => b.status === "pending").length;
  const wonBids = user.bids.filter((b) => b.status === "accepted").length;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Welcome back, {user.name}!</p>
          </div>
          <Link href="/post">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Post a Task
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Briefcase className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{openJobs}</div>
                <div className="text-xs text-muted-foreground">Open Tasks</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{inProgressJobs}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedJobs}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalBidsReceived}</div>
                <div className="text-xs text-muted-foreground">Bids Received</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* My Posted Tasks */}
          <section>
            <h2 className="mb-4 text-xl font-bold">My Posted Tasks</h2>
            {user.postedJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">You haven&apos;t posted any tasks yet.</p>
                <Link href="/post">
                  <Button variant="outline" className="mt-4">
                    Post Your First Task
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {user.postedJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="flex items-center justify-between p-4 transition hover:border-primary/50">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              job.status === "open"
                                ? "bg-emerald-400"
                                : job.status === "in_progress"
                                ? "bg-blue-400"
                                : "bg-muted-foreground"
                            }`}
                          />
                          <span className="text-sm font-medium truncate">{job.title}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{job.category.name}</span>
                          <span>${job.budgetMin}–${job.budgetMax}</span>
                          <span>{job._count.bids} bids</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium ${
                          job.status === "open"
                            ? "text-emerald-400"
                            : job.status === "in_progress"
                            ? "text-blue-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {job.status === "open" ? "Open" : job.status === "in_progress" ? "In Progress" : "Done"}
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* My Bids */}
          <section>
            <h2 className="mb-4 text-xl font-bold">My Bids</h2>
            {user.bids.length === 0 ? (
              <Card className="p-8 text-center">
                <DollarSign className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">You haven&apos;t placed any bids yet.</p>
                <Link href="/jobs">
                  <Button variant="outline" className="mt-4">
                    Browse Tasks
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {user.bids.map((bid) => (
                  <Link key={bid.id} href={`/jobs/${bid.jobId}`}>
                    <Card className="flex items-center justify-between p-4 transition hover:border-primary/50">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{bid.job.title}</div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Bid: ${bid.amount}</span>
                          <span>{bid.timeline}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium ${
                          bid.status === "pending"
                            ? "text-amber-400"
                            : bid.status === "accepted"
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {bid.status === "pending" ? "Pending" : bid.status === "accepted" ? "Accepted 🎉" : "Passed"}
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
