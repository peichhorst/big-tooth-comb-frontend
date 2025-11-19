import Link from "next/link";
import { notFound } from "next/navigation";
import { gqlFetch } from "@/lib/graphql";
import PageBanner from "../../components/PageBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUERY = `
  query ShowBySlug($slug: ID!) {
    show(id: $slug, idType: SLUG) {
      title
      slug
      date
      eventDate
      venue
      location
      ticketsUrl
      content
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`;

type Show = {
  title?: string | null;
  slug?: string | null;
  date?: string | null;
  eventDate?: string | null;
  venue?: string | null;
  location?: string | null;
  ticketsUrl?: string | null;
  content?: string | null;
  featuredImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null };
};

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = "then" in params ? await params : params;
  const { slug } = resolved;
  if (!slug) {
    notFound();
  }

  let show: Show | null = null;

  try {
    const data = await gqlFetch(QUERY, { slug });
    show = (data as { show?: Show | null })?.show ?? null;
  } catch (err) {
    console.error("Show fetch failed", err);
  }

  if (!show) {
    notFound();
  }

  const dateText = show.eventDate ?? show.date ?? "";
  let formattedDate = "TBA";
  if (dateText) {
    const d = new Date(dateText);
    if (!Number.isNaN(d.getTime())) {
      formattedDate = d.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }

  return (
    <section className="bg-black text-white">
      <PageBanner title={show.title || "Show"} />
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <Link
          href="/shows"
          className="inline-block text-blood-400 hover:text-white font-semibold"
        >
          Back to shows
        </Link>

        {show.featuredImage?.node?.sourceUrl && (
          <div className="overflow-hidden rounded-2xl border border-blood-800 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={show.featuredImage.node.sourceUrl}
              alt={show.featuredImage.node.altText || show.title || "Show image"}
              className="w-full h-auto"
            />
          </div>
        )}

        <div className="space-y-3 text-xl text-gray-200">
          <div className="font-mono text-blood-300">{formattedDate}</div>
          {show.venue && <div className="font-bold text-2xl">{show.venue}</div>}
          {show.location && <div className="text-gray-400">{show.location}</div>}
          {show.ticketsUrl && (
            <a
              href={show.ticketsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-blood-600 hover:bg-blood-500 text-white font-bold py-3 px-6 rounded-full transition"
            >
              Tickets
            </a>
          )}
        </div>

        {show.content && (
          <article
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: show.content }}
          />
        )}
      </div>
    </section>
  );
}
