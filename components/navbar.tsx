"use client";

import Link from "next/link";
import { useAuth, UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import {
  Briefcase,
  Menu,
  X,
  MessageCircle,
  Bell,
  BellDot,
  Loader2,
  CheckCheck,
  User,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isSignedIn) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications?unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchNotifications();
      // Poll every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      } catch {
        // silently fail
      }
    }
    setNotifOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "bid_placed":
        return "💰";
      case "bid_accepted":
        return "✅";
      case "job_completed":
        return "🎉";
      case "new_message":
        return "💬";
      case "review_received":
        return "⭐";
      default:
        return "🔔";
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="gradient-text">TaskBid</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Browse Jobs
          </Link>
          {isSignedIn && (
            <>
              <Link
                href="/messages"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                Messages
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Dashboard
              </Link>

              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    if (!notifOpen) fetchNotifications();
                    setNotifOpen(!notifOpen);
                  }}
                  className="relative flex items-center text-muted-foreground transition hover:text-foreground"
                  aria-label="Notifications"
                >
                  {unreadCount > 0 ? (
                    <BellDot className="h-5 w-5 text-primary" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-xl">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <span className="text-sm font-semibold">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs text-primary transition hover:text-primary/80"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifs ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50"
                          >
                            <span className="mt-0.5 text-lg">
                              {getNotifIcon(notif.type)}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm leading-snug">
                                {notif.message}
                              </p>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {new Date(notif.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setNotifOpen(false)}
                      className="block border-t border-border px-4 py-2.5 text-center text-xs text-primary transition hover:text-primary/80"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/post">
                <Button size="sm">Post a Task</Button>
              </Link>
            </>
          )}
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              {user && (
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center text-sm text-muted-foreground transition hover:text-foreground"
                  title="View Profile"
                >
                  <User className="h-4 w-4" />
                </Link>
              )}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
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
            <Link
              href="/jobs"
              className="text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              Browse Jobs
            </Link>
            {isSignedIn ? (
              <>
                <Link
                  href="/messages"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Messages
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                {user && (
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                    onClick={() => setOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                )}
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
