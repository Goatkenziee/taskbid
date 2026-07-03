"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
}

export function PostTaskForm({ categories }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    budgetMin: "",
    budgetMax: "",
    location: "",
    isRemote: false,
    urgent: false,
    deadline: "",
  });

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title || !form.description || !form.categoryId || !form.budgetMin || !form.budgetMax) {
      toast.error("Please fill in all required fields");
      return;
    }

    const budgetMin = Number(form.budgetMin);
    const budgetMax = Number(form.budgetMax);
    if (budgetMin <= 0 || budgetMax < budgetMin) {
      toast.error("Budget must be valid (max ≥ min)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budgetMin,
          budgetMax,
          deadline: form.deadline || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create task");
        return;
      }

      toast.success("Task posted! Now wait for bids.");
      router.push(`/jobs/${data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Task Title <span className="text-red-400">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. I need my living room painted"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what you need done in detail. Include any special requirements..."
            rows={4}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Min Budget ($) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.budgetMin}
              onChange={(e) => update("budgetMin", e.target.value)}
              placeholder="e.g. 20"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Max Budget ($) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.budgetMax}
              onChange={(e) => update("budgetMax", e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Location & Remote */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Location</label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Austin, TX"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.isRemote}
                onChange={(e) => update("isRemote", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Remote (can be done online)
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.urgent}
                onChange={(e) => update("urgent", e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              Urgent
            </label>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Deadline (optional)</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Posting..." : "Post Task & Open for Bids"}
        </Button>
      </form>
    </Card>
  );
}
