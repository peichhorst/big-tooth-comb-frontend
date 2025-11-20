"use client";

import { useEffect } from "react";

export default function CarouselEnhancer() {
  useEffect(() => {
    const enhanced = new WeakSet<Element>();
    const lightboxReady = new WeakSet<Element>();
    const cleanupFns: Array<() => void> = [];
    let overlay: HTMLDivElement | null = null;
    let overlayImg: HTMLImageElement | null = null;
    let overlayCaption: HTMLElement | null = null;
    let activeGallery: HTMLElement | null = null;
    let galleryImages: Array<{
      src: string;
      alt: string;
      caption?: string | null;
    }> = [];
    let activeIndex = 0;

    const closeLightbox = () => {
      overlay?.classList.remove("is-open");
      document.body.classList.remove("wp-lightbox-open");
      activeGallery = null;
      galleryImages = [];
      activeIndex = 0;
    };

    const overlayBackgroundHandler = (event: MouseEvent) => {
      if (event.target === overlay) {
        closeLightbox();
      }
    };

    const ensureLightbox = () => {
      if (overlay) {
        return overlay;
      }

      overlay = document.createElement("div");
      overlay.className = "wp-gallery-lightbox";
      overlay.innerHTML = `
        <div class="wp-gallery-lightbox__inner">
          <button type="button" class="wp-gallery-lightbox__close" aria-label="Close gallery">&times;</button>
          <button type="button" class="wp-gallery-lightbox__nav prev" aria-label="Previous image">‹</button>
          <figure>
            <img src="" alt="" />
            <figcaption class="wp-gallery-lightbox__caption"></figcaption>
          </figure>
          <button type="button" class="wp-gallery-lightbox__nav next" aria-label="Next image">›</button>
        </div>
      `;

      overlayImg = overlay.querySelector("img");
      overlayCaption = overlay.querySelector(".wp-gallery-lightbox__caption");

      const closeBtn = overlay.querySelector(".wp-gallery-lightbox__close");
      if (closeBtn) {
        closeBtn.addEventListener("click", closeLightbox);
        cleanupFns.push(() => closeBtn.removeEventListener("click", closeLightbox));
      }

      const prevBtn = overlay.querySelector(".wp-gallery-lightbox__nav.prev");
      const nextBtn = overlay.querySelector(".wp-gallery-lightbox__nav.next");
      if (prevBtn) {
        const handler = (event: Event) => {
          event.stopPropagation();
          moveLightbox(-1);
        };
        prevBtn.addEventListener("click", handler);
        cleanupFns.push(() => prevBtn.removeEventListener("click", handler));
      }
      if (nextBtn) {
        const handler = (event: Event) => {
          event.stopPropagation();
          moveLightbox(1);
        };
        nextBtn.addEventListener("click", handler);
        cleanupFns.push(() => nextBtn.removeEventListener("click", handler));
      }

      overlay.addEventListener("click", overlayBackgroundHandler);
      cleanupFns.push(() => overlay?.removeEventListener("click", overlayBackgroundHandler));

      document.body.appendChild(overlay);
      return overlay;
    };

    const openLightbox = (src: string, alt: string, caption?: string | null) => {
      if (!src) return;
      const element = ensureLightbox();
      if (!overlayImg) return;

      overlayImg.src = src;
      overlayImg.alt = alt || caption || "Gallery image";
      if (overlayCaption) {
        const text = caption || alt || "";
        overlayCaption.textContent = text;
        overlayCaption.style.display = text ? "block" : "none";
      }

      element.classList.add("is-open");
      document.body.classList.add("wp-lightbox-open");
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        moveLightbox(-1);
      } else if (event.key === "ArrowRight") {
        moveLightbox(1);
      }
    };

    document.addEventListener("keydown", handleKeydown);
    cleanupFns.push(() => document.removeEventListener("keydown", handleKeydown));

    const handleLightboxClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("button")) return;

      const figure = target.closest("figure");
      if (!figure || !figure.closest(".wp-block-gallery")) return;

      const img = figure.querySelector("img") as HTMLImageElement | null;
      if (!img) return;

      event.preventDefault();

      const gallery = figure.closest(".wp-block-gallery") as HTMLElement | null;
      if (!gallery) return;

      activeGallery = gallery;
      galleryImages = Array.from(gallery.querySelectorAll("figure img")).map((galleryImg) => {
        const data = galleryImg.dataset || {};
        const fullSrc =
          data.fullUrl ||
          data.fullsizeImage ||
          data.fullSizeImage ||
          data.src ||
          galleryImg.getAttribute("data-full-url") ||
          galleryImg.getAttribute("data-large-file") ||
          galleryImg.currentSrc ||
          galleryImg.src;
        const cap =
          galleryImg.closest("figure")?.getAttribute("aria-label")?.trim() ||
          galleryImg.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ||
          "";
        return {
          src: fullSrc || "",
          alt: galleryImg.alt || cap || "Gallery image",
          caption: cap,
        };
      });

      const dataset = img.dataset || {};
      const fullSrc =
        dataset.fullUrl ||
        dataset.fullsizeImage ||
        dataset.fullSizeImage ||
        dataset.src ||
        img.getAttribute("data-full-url") ||
        img.getAttribute("data-large-file") ||
        img.currentSrc ||
        img.src;
      const caption =
        figure.getAttribute("aria-label")?.trim() ||
        figure.querySelector("figcaption")?.textContent?.trim() ||
        "";

      activeIndex = galleryImages.findIndex((entry) => entry.src === fullSrc);
      if (activeIndex < 0) {
        activeIndex = Array.from(gallery.querySelectorAll("figure img")).indexOf(img);
      }
      if (activeIndex < 0) {
        activeIndex = 0;
      }

      openLightbox(fullSrc || "", img.alt || caption || "Gallery image", caption);
    };

    const moveLightbox = (direction: number) => {
      if (!galleryImages.length) return;
      activeIndex = (activeIndex + direction + galleryImages.length) % galleryImages.length;
      const next = galleryImages[activeIndex];
      openLightbox(next.src, next.alt, next.caption);
    };

    const attachLightbox = (gallery: Element) => {
      if (lightboxReady.has(gallery)) return;
      gallery.addEventListener("click", handleLightboxClick);
      lightboxReady.add(gallery);
      cleanupFns.push(() => gallery.removeEventListener("click", handleLightboxClick));
    };

    const enhance = () => {
      document.querySelectorAll(".wp-block-gallery").forEach((gallery) => attachLightbox(gallery));

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
          const totalWidth = slideWidth * originals.length;
          const startOffset = totalWidth;
          const tolerance = slideWidth * 0.25;
          track.scrollLeft = startOffset;

          const loopScroll = () => {
            const relative = track.scrollLeft - startOffset;
            if (relative <= -totalWidth + tolerance) {
              track.scrollLeft += totalWidth;
            } else if (relative >= totalWidth - tolerance) {
              track.scrollLeft -= totalWidth;
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

    return () => {
      observer.disconnect();
      cleanupFns.splice(0).forEach((fn) => fn());
      if (overlay) {
        overlay.remove();
      }
      overlay = null;
      overlayImg = null;
      overlayCaption = null;
      document.body.classList.remove("wp-lightbox-open");
    };
  }, []);

  return null;
}
