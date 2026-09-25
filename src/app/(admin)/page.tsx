"use client";

import { getStoredAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import React from "react";


const metrics = [
  { label: "Today’s appointments", value: "28", detail: "6 currently in progress", tone: "text-brand-500" },
  { label: "Today’s revenue", value: "₦486,500", detail: "+12.4% from last Tuesday", tone: "text-success-500" },
  { label: "Available therapists", value: "12 / 16", detail: "4 on leave or off shift", tone: "text-warning-500" },
  { label: "Pending payments", value: "₦92,000", detail: "8 appointments to reconcile", tone: "text-error-500" },
];

const appointments = [
  ["09:00", "Amaka Okafor", "Deep tissue massage", "Adaeze", "Checked in"],
  ["10:30", "Tolu Williams", "Glow facial", "Nneka", "Confirmed"],
  ["12:00", "Chiamaka Eze", "Aromatherapy", "Olamide", "Confirmed"],
  ["14:30", "David Cole", "Couples retreat", "Adaeze", "Pending"],
];

export default function SpaDashboard() {
  const [role, setRole] = useState("OWNER");

  useEffect(() => {
    setRole(getStoredAuth()?.user.role ?? "OWNER");
  }, []);

  const isTherapist = role === "THERAPIST";
  const isReceptionist = role === "RECEPTIONIST";
  const greeting = isTherapist ? "Your treatment day" : isReceptionist ? "Front desk overview" : "Spaelaris operations";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-brand-500">{greeting}</p>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Good morning</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isTherapist ? "Your assigned appointments and treatment schedule for today." : "Here is what is happening across Spaelaris today."}</p>
        </div>
        {!isTherapist && <a href="/appointments" className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600">New appointment</a>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(isTherapist ? metrics.slice(0, 2) : isReceptionist ? metrics.filter((metric) => metric.label !== "Available therapists") : metrics).map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
            <p className={`mt-3 text-2xl font-semibold ${metric.tone}`}>{metric.value}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white/90">Today’s schedule</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lagos · 28 appointments</p>
            </div>
            <a href="/appointments" className="text-sm font-medium text-brand-500 hover:text-brand-600">View appointments</a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {appointments.map(([time, customer, service, therapist, status]) => (
              <div key={`${time}-${customer}`} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_100px_90px]">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{time}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{customer}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{service}</p>
                </div>
                <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">{therapist}</span>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-center text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white/90">Quick actions</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Common front-desk tasks</p>
            </div>
            <span className="text-xl text-brand-500">✦</span>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ["Register customer", "Add a new customer to the directory", "/customers"],
              ["Manage availability", "Update therapist shifts and time off", "/calendar"],
              ["Review payments", "Reconcile today’s outstanding balances", "/payments"],
            ].map(([title, detail, href]) => (
              <a key={title} href={href} className="rounded-xl border border-gray-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/50 dark:border-gray-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-5 py-4 dark:border-brand-500/30 dark:bg-brand-500/5">
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Operations foundation</p>
        <p className="mt-1 text-sm text-brand-700/80 dark:text-brand-300/80">This dashboard is ready for live API data. The next vertical slice is staff authentication, customer lookup, and appointment creation.</p>
      </div>
    </div>
  );
}
