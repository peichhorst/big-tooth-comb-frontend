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
        left: "today",
        center: "title",
        right: "prev,next",
      }}
      height="auto"
      events={calendarEvents}
      eventClick={(info) => {
        if (info.event.url) {
          info.jsEvent.preventDefault();
          window.location.href = info.event.url;
        }
      }}
      dayCellContent={(arg) => (
        <div className="text-blood-400 font-bold">{arg.dayNumberText}</div>
      )}
      eventClassNames="cursor-pointer hover:opacity-80 transition"
      dayCellClassNames={(arg) => {
        const hasEvent = calendarEvents.some((event) => event.start === arg.dateStr);
        return hasEvent ? "has-event" : "";
      }}
    />
  );
}
