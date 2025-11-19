import { notFound } from "next/navigation";
import { fetchPostBySlug } from "@/lib/wp-api";
import PageBanner from "../../components/PageBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PostPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = "then" in params ? await params : params;
  const { slug } = resolved;
  if (!slug) {
    notFound();
  }

  const post = await fetchPostBySlug(slug);
  if (!post) {
    notFound();
  }

  return (
    <section className="bg-black text-white">
      <PageBanner title={post.title.rendered} />
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <article
          className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-blood-300 hover:prose-a:text-white"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      </div>
    </section>
  );
}
