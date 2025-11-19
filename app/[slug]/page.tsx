import { fetchPages } from "@/lib/wp-api";
import { notFound } from "next/navigation";
import PageBanner from "../components/PageBanner";

type WpPage = {
  title?: { rendered?: string };
  content?: { rendered?: string };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WpPage({ params }: { params: { slug?: string } | Promise<{ slug?: string }> }) {
  const resolved = "then" in params ? await params : params;
  const { slug = "" } = resolved;
  if (!slug || slug === "posts") {
    notFound();
  }

  let page: WpPage | null = null;
  try {
    page = (await fetchPages(slug)) as WpPage | null;
  } catch (error) {
    console.error("Error fetching page", error);
    notFound();
  }

  if (!page) {
    notFound();
  }

  return (
    <section className="bg-black text-white">
      <PageBanner title={page.title?.rendered ?? ""} />
      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-6">
        <article
          className="prose prose-invert max-w-none text-gray-200"
          dangerouslySetInnerHTML={{ __html: page.content?.rendered ?? "" }}
        />
      </main>
    </section>
  );
}
