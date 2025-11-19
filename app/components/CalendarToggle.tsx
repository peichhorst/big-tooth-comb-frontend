"use client";

import { useState } from "react";
import ShowCalendar, { type CalendarEvent } from "./ShowCalendar";

type CalendarToggleProps = {
  events: CalendarEvent[];
};

export default function CalendarToggle({ events }: CalendarToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-20 text-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center rounded-full bg-[#f2851f] px-10 py-3 font-black uppercase tracking-[0.2em] text-black shadow-lg transition hover:bg-[#ffb45a]"
        aria-expanded={open}
      >
        {open ? "Hide Calendar" : "View Calendar"}
      </button>

      {open && (
        <div className="bg-black/80 border-4 border-blood-700 rounded-2xl overflow-hidden shadow-2xl mt-8">
          <ShowCalendar events={events} />
        </div>
      )}
    </div>
  );
}
