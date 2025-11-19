import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import "./gutenburg.css";
import { gqlFetch } from "@/lib/graphql";
import CarouselEnhancer from "./components/CarouselEnhancer";
import HeaderNav from "./components/HeaderNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Big Tooth Comb",
  description: "Garage rock from the depths",
};

type MenuNode = { id: string; label: string; path?: string | null; url?: string | null };
type PageNode = { id: string; title: string; uri?: string | null };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let siteTitle = "BIG TOOTH COMB";
  let siteSlogan = "NO GODS • NO MANAGERS • JUST NOISE";
  let navItems: { id: string; label: string; href: string }[] = [];

  try {
    const data = await gqlFetch(`
      query Layout {
        generalSettings { title description }
        menus(where: { location: PRIMARY }) {
          nodes {
            menuItems { nodes { id label path url } }
          }
        }
        pages(first: 10, where: { status: PUBLISH }) {
          nodes { id title uri }
        }
      }
    `);

    siteTitle = data?.generalSettings?.title?.toUpperCase() ?? siteTitle;
    siteSlogan = data?.generalSettings?.description || siteSlogan;

    const menu = data?.menus?.nodes?.[0]?.menuItems?.nodes ?? [];
    navItems = menu.length > 0
      ? menu.map((i: MenuNode) => ({ id: i.id, label: i.label, href: i.path || i.url || "/" }))
      : (data?.pages?.nodes ?? []).map((p: PageNode) => ({ id: p.id, label: p.title, href: p.uri || "/" }));

  } catch (e) {
    console.error("Layout fetch failed", e);
  }

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://btc.858webdesign.com/wp-includes/css/dist/block-library/style.min.css"
        />
        <link
          rel="stylesheet"
          href="https://btc.858webdesign.com/wp-includes/js/mediaelement/mediaelementplayer-legacy.min.css"
        />
        <script
          src="https://btc.858webdesign.com/wp-includes/js/wp-embed.min.js"
          defer
        />
        <script
          src="https://btc.858webdesign.com/wp-includes/js/mediaelement/mediaelement-and-player.min.js"
          defer
        />
        <link rel="preconnect" href="https://btc.858webdesign.com" />
      </head>
      <body className="relative min-h-screen bg-black text-white overflow-x-hidden">
        <Providers>
          <div className="scanlines fixed inset-0 pointer-events-none" aria-hidden="true" />
          <HeaderNav navItems={navItems} siteTitle={siteTitle} />
          <main className="relative z-10 pb-20">{children}</main>
          <footer className="relative z-10 border-t-2 border-blood-700 bg-gradient-to-t from-black to-black/90">
            <div className="mx-auto max-w-7xl px-6 py-16 text-center">
              <Image src="/BTC Logo.png" alt={siteTitle} width={180} height={90} className="mx-auto drop-shadow-2xl" priority />
              <p className="mt-6 font-creepy text-2xl md:text-4xl text-blood-500 tracking-widest animate-pulse-slow">{siteSlogan}</p>
              <div className="mt-10">
                <iframe src="https://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid=100063616806973&width=200&layout=button_count&action=like&size=large&share=true&height=46" width="200" height="46" className="mx-auto border-0" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" title="Like Big Tooth Comb on Facebook" />
              </div>
              <p className="mt-10 text-xs uppercase tracking-widest text-gray-600">(c) {new Date().getFullYear()} Big Tooth Comb - All rights reserved (or whatever)</p>
            </div>
          </footer>
          <CarouselEnhancer />
        </Providers>
      </body>
    </html>
  );
}




