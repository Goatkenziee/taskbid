import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SaveButton } from "@/components/save-button";
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
  searchParams: { category?: string; search?: string; remote?: string; urgent?: string; location?: string };
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const where: any = { status: "open" };
  if (searchParams.category) {
    where.category = { slug: searchParams.category };
  }
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }
  if (searchParams.remote === "true") where.isRemote = true;
  if (searchParams.urgent === "true") where.urgent = true;
  if (searchParams.location) {
    where.location = { contains: searchParams.location, mode: "insensitive" };
  }

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
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted ${
                    searchParams.urgent === "true" ? "bg-muted font-medium text-primary" : ""
                  }`}
                >
                  <Zap className="h-4 w-4 text-amber-400" />
                  Urgent Only
                </Link>
                <Link
                  href={searchParams.remote === "true" ? "/jobs" : "/jobs?remote=true"}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted ${
                    searchParams.remote === "true" ? "bg-muted font-medium text-primary" : ""
                  }`}
                >
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  Remote Only
                </Link>
              </div>
            </Card>

            {/* Location filter */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Location
              </h3>
              <form method="GET" action="/jobs" className="space-y-2">
                {/* Preserve existing search params */}
                {searchParams.category && (
                  <input type="hidden" name="category" value={searchParams.category} />
                )}
                {searchParams.search && (
                  <input type="hidden" name="search" value={searchParams.search} />
                )}
                {searchParams.remote && (
                  <input type="hidden" name="remote" value={searchParams.remote} />
                )}
                {searchParams.urgent && (
                  <input type="hidden" name="urgent" value={searchParams.urgent} />
                )}
                <input
                  name="location"
                  defaultValue={searchParams.location || ""}
                  placeholder="City, state, or zip..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <Button type="submit" variant="outline" className="w-full text-sm">
                  Filter by Location
                </Button>
                {searchParams.location && (
                  <Link
                    href="/jobs"
                    className="block text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
                  >
                    Clear location filter
                  </Link>
                )}
              </form>
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
                  <Card
                    key={job.id}
                    className="group relative flex flex-col gap-3 p-5 transition hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link href={`/jobs/${job.id}`} className="absolute inset-0 z-0" />
                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-2">
                        {job.urgent && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            URGENT
                          </span>
                        )}
                        {job.isRemote && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            REMOTE
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 text-lg font-semibold group-hover:text-primary">
                        {job.title}
                      </h2>
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {timeAgo(job.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {job._count.bids} bid{job._count.bids !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="relative z-10 flex flex-shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatBudget(job.budgetMin, job.budgetMax)}
                        </div>
                        <div className="text-xs text-muted-foreground">est. budget</div>
                      </div>
                      <SaveButton jobId={job.id} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
