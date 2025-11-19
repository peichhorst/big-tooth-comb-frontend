// app/shows/page.tsx
import Link from "next/link";
import { gqlFetch } from "@/lib/graphql";
import ShowCalendar from "../components/ShowCalendar";
import PageBanner from "../components/PageBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUERY = `
  query Shows {
    shows(first: 100, where: { orderby: { field: DATE, order: ASC } }) {
      nodes {
        title
        date
        slug
        eventDate
        venue
        location
        ticketsUrl
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

type ShowNode = {
  title?: string;
  date?: string;
  slug?: string;
  eventDate?: string;
  venue?: string;
  location?: string;
  ticketsUrl?: string | null;
  featuredImage?: { node?: { sourceUrl?: string | null; altText?: string | null } | null };
};

type Event = {
  title: string;
  date: string;
  slug?: string;
  venue?: string;
  location?: string;
  ticketsUrl?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
};

export default async function ShowsPage() {
  let events: Event[] = [];

  try {
    const data = await gqlFetch(QUERY);
    events =
      (data.shows?.nodes as ShowNode[] | undefined)?.map((e) => ({
        title: e?.title ?? "Untitled",
        date: e?.eventDate ?? e?.date ?? "",
        slug: e?.slug,
        venue: e?.venue || "TBA",
        location: e?.location || "TBA",
        ticketsUrl: e?.ticketsUrl ?? null,
        imageUrl: e?.featuredImage?.node?.sourceUrl ?? null,
        imageAlt: e?.featuredImage?.node?.altText ?? "",
      })) || [];
  } catch (e) {
    console.error("Shows fetch failed", e);
  }

  return (
    <section className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-0">
        <PageBanner title="UPCOMING SHOWS" />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 ? (
            <p className="col-span-full text-center text-3xl text-gray-500">
              No shows yet. Chaos is brewing...
            </p>
          ) : (
            events.map((ev, i) => (
              <Link
                key={i}
                href={ev.slug ? `/shows/${ev.slug}` : "#"}
                className="group border-2 border-blood-800 rounded-xl overflow-hidden bg-black/60 backdrop-blur hover:border-blood-500 transition-all block"
              >
                {ev.imageUrl && (
                  <div className="aspect-[16/9] overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ev.imageUrl}
                      alt={ev.imageAlt || ev.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-8">
                  <time className="text-blood-400 font-mono text-lg">
                    {ev.date
                      ? new Date(ev.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "TBA"}
                  </time>
                  <h3 className="text-2xl font-black text-blood-300 mt-2">
                    {ev.venue}
                  </h3>
                  <p className="text-gray-400">{ev.location}</p>

                  <div className="mt-6">
                    <span className="inline-block bg-blood-600 group-hover:bg-blood-500 text-white font-bold py-3 px-8 rounded-full transition">
                      VIEW DETAILS
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="bg-black/80 border-4 border-blood-700 rounded-2xl overflow-hidden shadow-2xl mt-20">
          <ShowCalendar events={events} />
        </div>
      </div>
    </section>
  );
}
