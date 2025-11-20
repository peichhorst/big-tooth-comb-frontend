// components/ReverbNationWidget.tsx  ← recommended
"use client";

export default function ReverbNationWidget() {
  return (
    <div className="w-full max-w-md mx-auto my-12 px-6 sm:px-0">
      <div className="relative rounded-3xl border border-[#f2851f]/70 bg-black/10 backdrop-blur-[2px] shadow-[0_0_30px_rgba(242,133,31,0.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl border border-[#f2851f]/30 blur-[2px]"
        />
        <iframe
          width="300"
          height="360"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src="https://www.reverbnation.com/widget_code/html_widget/artist_3510193?widget_id=55&pwc[included_songs]=1&pwc[size]=custom&pwc[design]=custom&pwc[bgcolor]=none&pwc[border]=none&pwc[height]=400&pwc[width]=340&context_type=page_object"
          style={{ minWidth: "100%", maxWidth: "100%", background: "transparent" }}
          className="relative block h-[400px] w-full rounded-3xl"
          title="Big Tooth Comb on ReverbNation"
          loading="lazy"
        />
      </div>
    </div>
  );
}
