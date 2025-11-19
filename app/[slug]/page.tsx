import { fetchPages } from "@/lib/wp-api";
import { notFound } from "next/navigation";

type WpPage = {
  title?: { rendered?: string };
  content?: { rendered?: string };
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WpPage({ params }: { params: { slug?: string } }) {
  const { slug = "" } = params;
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
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-5">
      <h1
        className="text-3xl md:text-4xl font-bold text-blood-500"
        dangerouslySetInnerHTML={{ __html: page.title?.rendered ?? "" }}
      />
      <article
        className="prose prose-invert max-w-none text-gray-200"
        dangerouslySetInnerHTML={{ __html: page.content?.rendered ?? "" }}
      />
    </main>
  );
}
