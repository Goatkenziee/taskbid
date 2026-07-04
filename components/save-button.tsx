"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface SaveButtonProps {
  jobId: string;
  initialSaved?: boolean;
  className?: string;
}

export function SaveButton({ jobId, initialSaved = false, className = "" }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await res.json();
      setSaved(data.saved);
      toast.success(data.saved ? "Job saved!" : "Job unsaved");
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all ${
        saved
          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
      } ${loading ? "opacity-50" : ""} ${className}`}
      title={saved ? "Unsave job" : "Save job"}
    >
      <Heart
        className={`h-4 w-4 transition-all ${
          saved ? "fill-red-400 text-red-400" : ""
        }`}
      />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
