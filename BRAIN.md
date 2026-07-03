# BRAIN.md

## What this app does
A bidding and buying platform for local tasks and jobs — combining Instacart (gig/shopping tasks), Thumbtack (service marketplace), and eBay-style bidding mechanics.
Users can post tasks, bid on jobs, accept bids, complete jobs, review each other, and chat in real-time.

## Tech stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Clerk (email + social)
- **Styling**: Tailwind CSS
- **UI**: Custom components (Button, Card, etc.)
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Current state — fully functional
All core features are built and the production build passes cleanly:

### What has been built
- **Job listing & browsing** — `/jobs` page with search, category filter, location filter, and save/bookmark functionality
- **Job detail page** — `/jobs/[id]` with full info, bid form, reviews, chat, and save button
- **Bidding system** — place bids, accept/reject bids, auto-update job status
- **Messaging / Chat** — real-time polling chat per job with sender identification
- **Reviews & ratings** — star ratings with comments, aggregate stats, distribution
- **User profiles** — `/profile/[id]` with bio, completed jobs, reviews, stats
- **Dashboard** — overview of active jobs, won bids, earnings, recent activity
- **Post a task** — `/post` page with category selection, budget, description
- **Notifications** — bell dropdown with unread count, auto-polling
- **Saved jobs** — bookmark jobs to track later
- **Auth** — Clerk-powered sign-in/sign-up with middleware protection
- **Database** — Full Prisma schema with User, Job, Bid, Message, Review, Notification, SavedJob models
- **Seed data** — 10+ sample jobs across categories with realistic data

### API Routes
- `GET/POST /api/messages` — fetch and send messages per job
- `GET/POST /api/reviews` — fetch reviews and submit new ones
- `GET/POST /api/saved-jobs` — manage saved/bookmarked jobs
- `POST /api/create-job` — create a new job listing
- `POST /api/place-bid` — place a bid on a job
- `POST /api/accept-bid` — accept a bid (poster action)
- `POST /api/complete-job` — mark a job as completed
- `GET /api/notifications` — fetch user notifications
- `GET /api/users/[id]` — fetch user profile with stats
- `POST /api/webhooks/clerk` — Clerk webhook for user creation

### Fixed issues (latest run)
- Fixed TypeScript errors across all files
- Fixed `avatarUrl` → `imageUrl` field name to match Prisma schema
- Fixed chat-box.tsx `size="icon"` → custom button element
- Fixed reviews route null targetId type issue
- Fixed users/[id] route to use correct Prisma field names and relations
- Fixed profile page to use `imageUrl` and correct review data shape
- Production build now compiles successfully with no errors

### Verified
- [✓] `npx tsc --noEmit` — zero TypeScript errors
- [✓] `npm run build` — successful production build
- [✓] All 20 routes compile and are discoverable in the build output
