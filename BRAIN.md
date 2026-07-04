# BRAIN.md

## What this app does
A bidding and buying app for jobs/tasks — like Instacart + Thumbtack mixed into one. Users post tasks, workers bid on them, and the task owner picks the best bid.

## Tech stack
- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (with webhooks for user sync)
- **Database**: PostgreSQL + Prisma ORM
- **UI**: Tailwind CSS + custom components (lucide-react icons)
- **Deployment**: Vercel

## What has been built
- **DB models**: User, Category, Job, Bid, Message, Review, Notification, SavedJob
- **API routes (10)**: accept-bid, complete-job, create-job, messages, notifications, place-bid, reviews, saved-jobs, users/[id], webhooks/clerk
- **Pages (10)**: dashboard, jobs (list + detail), messages (list + detail), homepage, post-a-task, profile, sign-in, sign-up
- **Components (11)**: layout, navbar, bid-form, chat-box, notifications-dropdown, post-task-form, review-form, reviews-list, save-button, ui/button, ui/card

## Latest verification (2026-07-03)
- ✅ TypeScript compiles cleanly (`npx tsc --noEmit` = 0 errors)
- ✅ `npm run build` succeeds with zero errors
- ✅ CLERK_WEBHOOK_SECRET and NODE_ENV configured as app secrets (set via set_app_secret)
- ⏳ Deploy: Vercel token needs reconnecting (Settings → Integrations → Vercel → Reconnect)

## What's still pending
- Reconnect Vercel integration and deploy live
- Set real __REDACTED_SECRET__set_in_env_not_source values for CLERK_WEBHOOK_SECRET, DATABASE_URL, etc. in Vercel dashboard

## User preferences
- Keep changes focused, modern, and __REDACTED_SECRET__set_in_env_not_source-ready.
- Minimal changes — surgical fixes only.
