"use client";

import { useEffect } from "react";

export default function CarouselEnhancer() {
  useEffect(() => {
    const enhanced = new WeakSet<Element>();

    const enhance = () => {
      document
        .querySelectorAll(".wp-block-gallery[data-carousel], .wp-block-gallery.gallery-carousel")
        .forEach((gallery) => {
          if (enhanced.has(gallery)) return;
          enhanced.add(gallery);

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

          // clone slides to allow smooth looping
          const originals = Array.from(track.children) as HTMLElement[];
          originals.forEach((fig) => track.appendChild(fig.cloneNode(true)));
          originals.slice().forEach((fig) => track.insertBefore(fig.cloneNode(true), track.firstChild));

          const firstSlide = track.querySelector("figure");
          const slideWidth = firstSlide ? (firstSlide as HTMLElement).getBoundingClientRect().width + 8 : 260;
          const startOffset = slideWidth * originals.length;
          const maxScroll = slideWidth * (track.children.length - originals.length);
          track.scrollLeft = startOffset;

          const loopScroll = () => {
            if (track.scrollLeft <= slideWidth * 0.5) {
              track.scrollLeft = startOffset + track.scrollLeft;
            } else if (track.scrollLeft >= maxScroll - slideWidth * 0.5) {
              track.scrollLeft = track.scrollLeft - startOffset;
            }
          };

          const createButton = (cls: string, label: string, dir: number) => {
            const button = document.createElement("button");
            button.className = `wp-gallery-btn ${cls}`;
            button.type = "button";
            button.textContent = label;
            button.addEventListener("click", () => {
              track.scrollBy({ left: dir * slideWidth, behavior: "smooth" });
              setTimeout(loopScroll, 300);
            });
            return button;
          };

          track.addEventListener("scroll", loopScroll);

          gallery.appendChild(createButton("prev", "\u2039", -1));
          gallery.appendChild(createButton("next", "\u203a", 1));

          let autoPlay = window.setInterval(() => {
            track.scrollBy({ left: slideWidth, behavior: "smooth" });
            setTimeout(loopScroll, 300);
          }, 2200);

          gallery.addEventListener("mouseenter", () => {
            window.clearInterval(autoPlay);
          });
          gallery.addEventListener("mouseleave", () => {
            autoPlay = window.setInterval(() => {
              track.scrollBy({ left: slideWidth, behavior: "smooth" });
              setTimeout(loopScroll, 300);
            }, 2200);
          });
        });
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
