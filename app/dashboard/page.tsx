"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewsList } from "@/components/reviews-list";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Star,
  Loader2,
  ChevronRight,
  FileText,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

type JobStatus = "open" | "in_progress" | "completed";

interface Job {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  status: JobStatus;
  createdAt: string;
  category: { name: string };
  _count: { bids: number };
  bids: { id: string; amount: number; status: string; bidder: { name: string } }[];
}

interface MessageThread {
  id: string;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  partnerName: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { name: string };
  job: { title: string };
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "active" | "bids" | "in-progress" | "completed" | "messages" | "reviews"
  >("active");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setLoading(true);

    // Fetch jobs
    fetch("/api/create-job?mine=true")
      .then((r) => r.json())
      .then((data) => {
        setJobs(data.jobs || []);
      })
      .catch(console.error);

    // Fetch message threads
    fetch("/api/messages?threads=true")
      .then((r) => r.json())
      .then((data) => {
        setMessageThreads(data.threads || []);
      })
      .catch(console.error);

    // Fetch reviews about me
    fetch("/api/reviews?targetId=me")
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, isLoaded, router]);

  if (!isLoaded || !user) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex max-w-6xl items-center justify-center px-4 py-40 sm:px-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </>
    );
  }

  const myJobs = jobs.filter((j) => j.status !== "completed");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const inProgressJobs = jobs.filter((j) => j.status === "in_progress");

  const totalEarned = completedJobs.reduce(
    (sum, j) => sum + (j.bids.find((b) => b.status === "accepted")?.amount || 0),
    0
  );

  const tabs = [
    { id: "active" as const, label: "Active Jobs", icon: Briefcase },
    { id: "bids" as const, label: "My Bids", icon: DollarSign },
    { id: "in-progress" as const, label: "In Progress", icon: Clock },
    { id: "completed" as const, label: "Completed", icon: CheckCircle },
    { id: "messages" as const, label: "Messages", icon: MessageCircle },
    { id: "reviews" as const, label: "Reviews", icon: Star },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {user.firstName || "User"}
          </p>
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myJobs.length}</p>
                <p className="text-xs text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressJobs.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <CheckCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedJobs.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalEarned}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activeTab === "active" ? (
          <div className="space-y-4">
            {myJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">No active tasks</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Post a new task to get started.
                </p>
                <Link href="/post">
                  <Button className="mt-4">Post a Task</Button>
                </Link>
              </Card>
            ) : (
              myJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="flex items-start justify-between p-5 transition-colors hover:bg-card/80">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{job.title}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            job.status === "open"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {job.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {job.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>${job.budgetMin}–${job.budgetMax}</span>
                        <span>{job._count.bids} bids</span>
                        <span>{job.category.name}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : activeTab === "bids" ? (
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">No bids yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse available jobs and place a bid.
                </p>
                <Link href="/jobs">
                  <Button className="mt-4">Browse Jobs</Button>
                </Link>
              </Card>
            ) : (
              jobs.flatMap((job) =>
                job.bids.map((bid) => (
                  <Link key={bid.id} href={`/jobs/${job.id}`}>
                    <Card className="flex items-start justify-between p-5 transition-colors hover:bg-card/80">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              bid.status === "accepted"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : bid.status === "rejected"
                                ? "bg-muted text-muted-foreground"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {bid.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-primary">
                            ${bid.amount}
                          </span>
                          <span>{job.category.name}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </Card>
                  </Link>
                ))
              )
            )}
          </div>
        ) : activeTab === "in-progress" ? (
          <div className="space-y-4">
            {inProgressJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">Nothing in progress</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accept a bid to start working on a task.
                </p>
              </Card>
            ) : (
              inProgressJobs.map((job) => {
                const acceptedBid = job.bids.find((b) => b.status === "accepted");
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="flex items-start justify-between p-5 transition-colors hover:bg-card/80">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                            In Progress
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {job.description}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>${job.budgetMin}–${job.budgetMax}</span>
                          {acceptedBid && (
                            <span>Pro: {acceptedBid.bidder.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        ) : activeTab === "completed" ? (
          <div className="space-y-4">
            {completedJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">No completed tasks</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completed tasks will appear here.
                </p>
              </Card>
            ) : (
              completedJobs.map((job) => {
                const acceptedBid = job.bids.find((b) => b.status === "accepted");
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="flex items-start justify-between p-5 transition-colors hover:bg-card/80">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                            Completed
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>${job.budgetMin}–${job.budgetMax}</span>
                          {acceptedBid && (
                            <span>Won by: {acceptedBid.bidder.name}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        ) : activeTab === "messages" ? (
          <div className="space-y-4">
            {messageThreads.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">No messages yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Messages will appear here once you accept a bid or get hired.
                </p>
              </Card>
            ) : (
              messageThreads.map((thread) => (
                <Link key={thread.id} href={`/messages/${thread.jobId}`}>
                  <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-card/80">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {thread.partnerName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {thread.jobTitle}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        with {thread.partnerName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        thread.jobStatus === "in_progress"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {thread.jobStatus.replace("_", " ")}
                    </span>
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : activeTab === "reviews" ? (
          <div>
            <ReviewsList targetId="me" />
          </div>
        ) : null}
      </main>
    </>
  );
}
