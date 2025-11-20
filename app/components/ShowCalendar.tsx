"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export type CalendarEvent = {
  title: string;
  date: string;
  slug?: string;
  venue?: string;
  location?: string;
  ticketsUrl?: string | null;
};

export default function ShowCalendar({ events }: { events: CalendarEvent[] }) {
  const calendarEvents = (events || [])
    .filter((ev) => ev.date)
    .map((ev) => ({
      title: `${ev.venue ?? "TBA"} - ${ev.location ?? "TBA"}`,
      start: ev.date.split("T")[0],
      url: ev.slug ? `/shows/${ev.slug}` : undefined,
      classNames: ev.ticketsUrl ? "has-tickets" : "sold-out",
    }));
  const eventDateSet = new Set(calendarEvents.map((ev) => ev.start));

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
      dayCellContent={(arg) => {
        const dateKey = arg.date.toISOString().split("T")[0];
        const hasEvent = eventDateSet.has(dateKey);
        return (
          <div
            className={`fc-daygrid-day-number font-bold ${
              hasEvent ? "has-event-number" : ""
            }`}
          >
            {arg.dayNumberText}
          </div>
        );
      }}
      eventClassNames="cursor-pointer hover:opacity-80 transition"
      dayCellClassNames={(arg) => {
        const hasEvent = calendarEvents.some((event) => event.start === arg.dateStr);
        return hasEvent ? "has-event" : "";
      }}
    />
  );
}
