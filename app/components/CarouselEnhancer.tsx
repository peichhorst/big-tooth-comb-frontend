"use client";

import { useEffect } from "react";

export default function CarouselEnhancer() {
  useEffect(() => {
    const upgrades = new WeakSet<Element>();

    const enhance = () => {
      document.querySelectorAll(".wp-block-gallery[data-carousel], .wp-block-gallery.gallery-carousel").forEach((gallery) => {
        if (upgrades.has(gallery)) return;
        upgrades.add(gallery);

        const figures = Array.from(gallery.children).filter(
          (child) => (child as HTMLElement).tagName?.toLowerCase() === "figure"
        ) as HTMLElement[];
        if (!figures.length) return;

        gallery.classList.add("wp-gallery-carousel");
        const track = document.createElement("div");
        track.className = "wp-gallery-track";
        figures.forEach((fig) => track.appendChild(fig));
        gallery.textContent = "";
        gallery.appendChild(track);

        // clone for seamless loop
        const originals = Array.from(track.children) as HTMLElement[];
        originals.forEach((fig) => track.appendChild(fig.cloneNode(true)));
        originals.forEach((fig) => track.insertBefore(fig.cloneNode(true), track.firstChild));

        const firstSlide = track.querySelector("figure");
        const slideWidth = firstSlide ? (firstSlide as HTMLElement).getBoundingClientRect().width + 8 : 260;
        const startOffset = slideWidth * originals.length;
        const totalSlides = track.children.length;
        const maxLoopOffset = slideWidth * (totalSlides - originals.length);
        track.scrollLeft = startOffset;

        const btn = (cls: string, label: string, dir: number) => {
          const b = document.createElement("button");
          b.className = `wp-gallery-btn ${cls}`;
          b.type = "button";
          b.textContent = label;
          b.addEventListener("click", () => {
            track.scrollBy({ left: dir * slideWidth, behavior: "smooth" });
            snapToMiddle();
          });
          return b;
        };

        const snapToMiddle = () => {
          if (track.scrollLeft <= slideWidth * 0.5) {
            track.scrollLeft = startOffset + track.scrollLeft;
          } else if (track.scrollLeft >= maxLoopOffset - slideWidth * 0.5) {
            track.scrollLeft = track.scrollLeft - startOffset;
          }
        };

        // keep loop on manual scrolls (wheel/drag)
        track.addEventListener("scroll", () => {
          snapToMiddle();
        });

        const prev = btn("prev", "‹", -1);
        const next = btn("next", "›", 1);
        gallery.appendChild(prev);
        gallery.appendChild(next);

        let autoPlay = window.setInterval(() => {
          track.scrollBy({ left: slideWidth, behavior: "smooth" });
          snapToMiddle();
        }, 2200);

        gallery.addEventListener("mouseenter", () => {
          window.clearInterval(autoPlay);
        });
        gallery.addEventListener("mouseleave", () => {
          autoPlay = window.setInterval(() => {
            track.scrollBy({ left: slideWidth, behavior: "smooth" });
            snapToMiddle();
          }, 2200);
        });
      });
    };

    enhance();
    const obs = new MutationObserver(enhance);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => obs.disconnect();
  }, []);

  return null;
}
