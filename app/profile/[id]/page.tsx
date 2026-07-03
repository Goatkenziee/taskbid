"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Star,
  MapPin,
  Calendar,
  CheckCircle,
  Briefcase,
  MessageCircle,
  Loader2,
  DollarSign,
  Clock,
} from "lucide-react";

interface ProfileUser {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  imageUrl: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string;
  completedJobs: number;
  averageRating: number;
  reviewCount: number;
}

interface Job {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  status: string;
  createdAt: string;
  category: { name: string };
  _count: { bids: number };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { name: string; imageUrl: string | null };
  job: { title: string };
}

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = params.id as string;
    if (!userId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/users/${userId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/jobs?userId=${userId}&status=completed`).then((r) =>
        r.ok ? r.json() : { jobs: [] }
      ),
      fetch(`/api/reviews?targetId=${userId}`).then((r) =>
        r.ok ? r.json() : { reviews: [] }
      ),
    ])
      .then(([userData, jobsData, reviewsData]) => {
        if (!userData) {
          setError("User not found");
          return;
        }
        setProfile(userData.user || userData);
        setCompletedJobs(jobsData.jobs || []);
        setReviews(reviewsData.reviews || []);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex max-w-4xl items-center justify-center px-4 py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-red-400">
            {error || "User not found"}
          </h1>
          <Link href="/jobs">
            <Button className="mt-4" variant="outline">
              Browse Jobs
            </Button>
          </Link>
        </main>
      </>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(rating)
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Profile header */}
        <Card className="mb-8 overflow-hidden">
          {/* Cover banner */}
          <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-muted" />

          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-12 mb-4 flex items-end gap-5">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted text-3xl font-bold text-primary shadow-lg">
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.name?.charAt(0)?.toUpperCase() || "?"
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined{" "}
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-4 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(profile.averageRating)}</div>
                <span className="text-sm text-muted-foreground">
                  ({profile.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {profile.completedJobs} jobs completed
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mb-4 text-sm text-muted-foreground">
                {profile.bio}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href={`/messages/new?userId=${profile.id}`}>
                <Button className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Completed jobs */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="h-5 w-5 text-primary" />
            Completed Jobs ({completedJobs.length})
          </h2>
          {completedJobs.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No completed jobs yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {completedJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="flex items-center justify-between p-4 transition-colors hover:bg-card/50">
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${job.budgetMin} – ${job.budgetMax}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Completed
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Star className="h-5 w-5 text-amber-400" />
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No reviews yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {review.reviewer.imageUrl ? (
                        <img
                          src={review.reviewer.imageUrl}
                          alt={review.reviewer.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        review.reviewer.name?.charAt(0)?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {review.reviewer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        on {review.job.title}
                      </p>
                    </div>
                    <div className="ml-auto flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
