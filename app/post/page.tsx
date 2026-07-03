import { Navbar } from "@/components/navbar";
import { PostTaskForm } from "@/components/post-task-form";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PostPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Post a Task</h1>
          <p className="mt-1 text-muted-foreground">
            Describe what you need done and let pros bid on it.
          </p>
        </div>
        <PostTaskForm categories={categories} />
      </main>
    </>
  );
}
