"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type NavItem = { id: string; label: string; href: string };

export default function HeaderNav({ navItems, siteTitle }: { navItems: NavItem[]; siteTitle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative bg-black border-b border-blood-700">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-0 py-5">
        <Link href="/" className="flex items-center">
          <Image src="/BTC Logo.png" alt={siteTitle} width={180} height={90} className="h-auto w-auto drop-shadow-2xl" priority />
        </Link>

        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
            className="rounded-md border border-blood-700 px-3 py-2 text-blood-400 hover:border-blood-500 hover:bg-blood-500/20 hover:text-white"
          >
            ☰
          </button>
        </div>

        <nav
          className={`${
            open ? "flex" : "hidden"
          } absolute left-0 right-0 top-full flex-col gap-2 border-b border-blood-700 bg-black/95 px-6 pb-4 pt-3 md:static md:flex md:flex-row md:items-center md:gap-3 md:border-none md:bg-transparent md:p-0`}
        >
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-full border border-blood-700 bg-blood-900/30 px-5 py-2.5 font-bold uppercase tracking-wider text-blood-400 transition hover:border-blood-500 hover:bg-blood-500/20 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
