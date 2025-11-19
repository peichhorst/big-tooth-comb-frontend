// components/ReverbNationWidget.tsx  ← recommended
"use client";

export default function ReverbNationWidget() {
  return (
    
    <div className="w-full max-w-md mx-auto my-12">
      <iframe
        width="300"
        height="360"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src="https://www.reverbnation.com/widget_code/html_widget/artist_3510193?widget_id=55&pwc[included_songs]=1&pwc[size]=custom&pwc[design]=custom&pwc[bgcolor]=none&pwc[border]=none&pwc[height]=400&pwc[width]=340&context_type=page_object"
        style={{ width: "0px", minWidth: "100%", maxWidth: "100%" }}
        title="Big Tooth Comb on ReverbNation"
        loading="lazy"
      />
    </div>
  );
}