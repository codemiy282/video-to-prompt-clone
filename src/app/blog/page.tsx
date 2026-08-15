import BlogList from "@/components/BlogList";
import { listPosts } from "@/lib/wordpress";

export default async function BlogPage() {
  const posts = await listPosts();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-3xl px-6">
          <BlogList posts={posts} />
        </div>
      </section>
    </div>
  );
}
