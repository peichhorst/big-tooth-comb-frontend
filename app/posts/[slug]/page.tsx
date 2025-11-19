import { notFound } from "next/navigation";
import { fetchPostBySlug } from "@/lib/wp-api";

export default async function PostPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const post = await fetchPostBySlug(slug);
  if (!post) {
    notFound();
  }

  return (
    <section className="min-h-screen bg-black text-white py-16">
      <div className="max-w-5xl mx-auto px-6 space-y-10">
        <h1
          className="text-4xl md:text-6xl font-black text-blood-500 glitch"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />

        <article
          className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-blood-300 hover:prose-a:text-white"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      </div>
    </section>
  );
}
