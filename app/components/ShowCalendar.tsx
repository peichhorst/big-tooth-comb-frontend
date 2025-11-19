"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

type Event = {
  title: string;
  date: string;
  slug?: string;
  venue?: string;
  location?: string;
  ticketsUrl?: string | null;
};

export default function ShowCalendar({ events }: { events: Event[] }) {
  const calendarEvents = (events || [])
    .filter((ev) => ev.date)
    .map((ev) => ({
      title: `${ev.venue ?? "TBA"} - ${ev.location ?? "TBA"}`,
      start: ev.date.split("T")[0],
      url: ev.slug ? `/shows/${ev.slug}` : undefined,
      classNames: ev.ticketsUrl ? "has-tickets" : "sold-out",
    }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "",
      }}
      height="auto"
      events={calendarEvents}
      eventClick={(info) => {
        if (info.event.url) {
          info.jsEvent.preventDefault();
          window.open(info.event.url, "_blank", "noopener,noreferrer");
        }
      }}
      dayCellContent={(arg) => (
        <div className="text-blood-400 font-bold">{arg.dayNumberText}</div>
      )}
      eventClassNames="cursor-pointer hover:opacity-80 transition"
    />
  );
}
