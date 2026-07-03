import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import {
  Search,
  DollarSign,
  ShieldCheck,
  Zap,
  Star,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Briefcase,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Find Any Task",
    desc: "From grocery delivery to home repairs, graphic design to dog walking — post what you need.",
  },
  {
    icon: DollarSign,
    title: "Pros Bid for You",
    desc: "Skilled workers compete for your task. You pick the best price and timeline.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Verified",
    desc: "Every pro is reviewed. Payments are protected. You're in control.",
  },
  {
    icon: Zap,
    title: "Get It Done Fast",
    desc: "Urgent tasks get priority. Most jobs are matched within hours, not days.",
  },
];

const stats = [
  { icon: Users, value: "12K+", label: "Active Pros" },
  { icon: Star, value: "4.9", label: "Avg Rating" },
  { icon: TrendingUp, value: "50K+", label: "Tasks Done" },
  { icon: Clock, value: "< 2hrs", label: "Avg Match Time" },
];

const categories = [
  { name: "Delivery & Errands", icon: "🛒", desc: "Groceries, packages, food", slug: "delivery" },
  { name: "Home Services", icon: "🔧", desc: "Cleaning, repairs, assembly", slug: "home-services" },
  { name: "Design & Creative", icon: "🎨", desc: "Logo, web design, editing", slug: "design" },
  { name: "Tech & IT", icon: "💻", desc: "Web dev, IT support, coding", slug: "tech" },
  { name: "Tutoring & Lessons", icon: "📚", desc: "Academic, music, coaching", slug: "tutoring" },
  { name: "Moving & Labor", icon: "📦", desc: "Moving help, hauling, assembly", slug: "moving" },
  { name: "Pet Services", icon: "🐾", desc: "Walking, sitting, grooming", slug: "pets" },
  { name: "Event Help", icon: "🎉", desc: "Photography, catering, setup", slug: "events" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" />
              Now live — post a task and get bids in minutes
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl sm:leading-tight">
              Post a Task.{" "}
              <span className="gradient-text">Get Bids.</span>
              <br />
              Get It Done.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              The marketplace where you post what you need and skilled pros compete for your business.
              Like Instacart meets Thumbtack — all in one.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/post">
                <Button className="h-13 gap-2 px-8 text-base">
                  Post a Task <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" className="h-13 px-8 text-base">
                  Browse Jobs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-b border-border px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-b border-border px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-3xl font-bold">How It Works</h2>
            <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
              Three simple steps to get your task done by a top-rated pro.
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: "1", title: "Post Your Task", desc: "Tell us what you need done, set your budget, and choose a category." },
                { step: "2", title: "Receive Bids", desc: "Skilled pros review your task and send you competitive bids with timelines." },
                { step: "3", title: "Pick & Pay", desc: "Choose the best bid, get the work done, and release payment when satisfied." },
              ].map((s) => (
                <Card key={s.step} className="relative pt-12 text-center">
                  <div className="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="border-b border-border px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-3xl font-bold">Browse by Category</h2>
            <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
              Find the right pro for any job, from quick errands to big projects.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {categories.map((cat) => (
                <Link key={cat.name} href={`/jobs?category=${cat.slug}`}>
                  <Card className="group cursor-pointer transition hover:border-primary/50">
                    <div className="text-3xl">{cat.icon}</div>
                    <h3 className="mt-3 font-semibold">{cat.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{cat.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
          <div className="mx-auto max-w-6xl">
            <p className="flex items-center justify-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="font-semibold gradient-text">TaskBid</span>
            </p>
            <p className="mt-2">© 2025 TaskBid. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
