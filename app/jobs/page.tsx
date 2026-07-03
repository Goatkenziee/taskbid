import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MapPin, Clock, DollarSign, Users, Search, Zap } from "lucide-react";

function formatBudget(min: number, max: number) {
  return `$${min} – $${max}`;
}

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

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; remote?: string; urgent?: string };
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const where: any = { status: "open" };
  if (searchParams.category) {
    where.category = { slug: searchParams.category };
  }
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search } },
      { description: { contains: searchParams.search } },
    ];
  }
  if (searchParams.remote === "true") where.isRemote = true;
  if (searchParams.urgent === "true") where.urgent = true;

  const jobs = await prisma.job.findMany({
    where,
    include: {
      poster: { select: { id: true, name: true, imageUrl: true } },
      category: true,
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Open Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Find tasks posted by people near you. Place your bid and get hired.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar filters */}
          <aside className="space-y-6 lg:col-span-1">
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </h3>
              <div className="space-y-1">
                <Link
                  href="/jobs"
                  className={`block rounded-md px-3 py-2 text-sm transition hover:bg-muted ${
                    !searchParams.category ? "bg-muted font-medium text-primary" : ""
                  }`}
                >
                  All Tasks
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/jobs?category=${cat.slug}`}
                    className={`block rounded-md px-3 py-2 text-sm transition hover:bg-muted ${
                      searchParams.category === cat.slug ? "bg-muted font-medium text-primary" : ""
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Filters
              </h3>
              <div className="space-y-2">
                <Link
                  href={searchParams.urgent === "true" ? "/jobs" : "/jobs?urgent=true"}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
                >
                  <Zap className="h-4 w-4 text-amber-400" />
                  Urgent Only
                </Link>
                <Link
                  href={searchParams.remote === "true" ? "/jobs" : "/jobs?remote=true"}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
                >
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  Remote Only
                </Link>
              </div>
            </Card>
          </aside>

          {/* Job listings */}
          <div className="lg:col-span-3">
            {/* Search bar */}
            <form className="mb-6 flex gap-3" method="GET" action="/jobs">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="search"
                  defaultValue={searchParams.search || ""}
                  placeholder="Search tasks..."
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            {jobs.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No tasks found matching your criteria.</p>
                <Link href="/jobs">
                  <Button variant="outline" className="mt-4">
                    Clear Filters
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="group flex flex-col gap-3 p-5 transition hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {job.urgent && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                              Urgent
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{job.category.name}</span>
                        </div>
                        <h3 className="mt-1 text-lg font-semibold group-hover:text-primary">
                          {job.title}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                          {job.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatBudget(job.budgetMin, job.budgetMax)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {job._count.bids} bids
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeAgo(job.createdAt)}
                          </span>
                          {!job.isRemote && job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          )}
                          {job.isRemote && (
                            <span className="text-emerald-400">Remote</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <div className="text-sm font-semibold gradient-text">
                          {formatBudget(job.budgetMin, job.budgetMax)}
                        </div>
                        <div className="text-xs text-muted-foreground">est. budget</div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
