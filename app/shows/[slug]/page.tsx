import Link from "next/link";
import { notFound } from "next/navigation";
import { gqlFetch } from "@/lib/graphql";

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
};

export default async function ShowPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
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
    <section className="min-h-screen bg-black text-white py-16">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <Link
          href="/shows"
          className="inline-block text-blood-400 hover:text-white font-semibold"
        >
          Back to shows
        </Link>

        <h1 className="text-5xl md:text-7xl font-black text-blood-500 glitch">
          {show.title || "Show"}
        </h1>

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
