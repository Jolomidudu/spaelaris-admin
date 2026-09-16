import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Spaelaris appointments",
  description: "Spaelaris appointment calendar and booking board",
};

const summaryCards = [
  { label: "Booked today", value: "28", detail: "12 confirmed • 4 in progress" },
  { label: "Therapist coverage", value: "12 / 16", detail: "4 off-shift or on leave" },
  { label: "Revenue in queue", value: "₦486,500", detail: "Across 7 active bookings" },
  { label: "No-shows", value: "2", detail: "This week vs. 3 last week" },
];

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Appointments" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{card.detail}</p>
          </div>
        ))}
      </div>

      <Calendar />
    </div>
  );
}
