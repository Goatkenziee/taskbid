"use client";

import Link from "next/link";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Briefcase, Menu, X, Search } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="gradient-text">TaskBid</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/jobs" className="text-sm text-muted-foreground transition hover:text-foreground">
            Browse Jobs
          </Link>
          {isSignedIn && (
            <>
              <Link href="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/post">
                <Button size="sm">Post a Task</Button>
              </Link>
            </>
          )}
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/jobs" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
              Browse Jobs
            </Link>
            {isSignedIn ? (
              <>
                <Link href="/dashboard" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/post" onClick={() => setOpen(false)}>
                  <Button className="w-full">Post a Task</Button>
                </Link>
                <div className="flex items-center gap-3 pt-2">
                  <UserButton />
                  <span className="text-sm text-muted-foreground">Account</span>
                </div>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
