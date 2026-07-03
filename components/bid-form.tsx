"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";

interface Props {
  jobId: string;
  existingBid?: {
    amount: number;
    description: string;
    timeline: string;
  } | undefined;
}

export function BidForm({ jobId, existingBid }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(existingBid?.amount?.toString() || "");
  const [description, setDescription] = useState(existingBid?.description || "");
  const [timeline, setTimeline] = useState(existingBid?.timeline || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !description || !timeline) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/place-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, amount: Number(amount), description, timeline }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit bid");
        return;
      }

      toast.success(existingBid ? "Bid updated!" : "Bid placed!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-lg font-bold">
        {existingBid ? "Update Your Bid" : "Place Your Bid"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Your Bid Amount ($)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Timeline
          </label>
          <input
            type="text"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="e.g. 2 days, This weekend"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Why you? (message to the poster)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="I have experience with this type of work..."
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Submitting..." : existingBid ? "Update Bid" : "Submit Bid"}
        </Button>
      </form>
    </Card>
  );
}
