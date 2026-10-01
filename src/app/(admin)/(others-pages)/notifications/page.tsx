"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { AlertTriangle, CalendarDays, CreditCard, UserRound } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type Notification = {
  id: string;
  kind: "appointment" | "payment" | "customer";
  title: string;
  description: string;
  createdAt: string;
  href: string;
  priority: "urgent" | "normal";
};

type Filter = "all" | "urgent" | Notification["kind"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

function notificationIcon(notification: Notification) {
  if (notification.priority === "urgent") return <AlertTriangle size={18} aria-hidden="true" />;
  if (notification.kind === "appointment") return <CalendarDays size={18} aria-hidden="true" />;
  if (notification.kind === "payment") return <CreditCard size={18} aria-hidden="true" />;
  return <UserRound size={18} aria-hidden="true" />;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedId(new URLSearchParams(window.location.search).get("selected") ?? "");
    let isMounted = true;

    async function loadNotifications() {
      const token = getAccessToken();
      if (!token) {
        if (isMounted) {
          setError("Your session has expired. Please sign in again.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to load notifications.");
        }
        if (isMounted) setNotifications(payload as Notification[]);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedNotification = notifications.find((notification) => notification.id === selectedId);
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "urgent") return notification.priority === "urgent";
    return filter === "all" || notification.kind === filter;
  });

  function selectNotification(notification: Notification) {
    setSelectedId(notification.id);
    window.history.replaceState(null, "", `/notifications?selected=${encodeURIComponent(notification.id)}`);
  }

  function clearSelection() {
    setSelectedId("");
    window.history.replaceState(null, "", "/notifications");
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Notifications" />
      <section className="border-b border-gray-200 pb-5 dark:border-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">All notifications</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Recent appointments, customers, payments, and items needing attention.</p>
      </section>

      {selectedNotification && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedNotification.priority === "urgent" ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                {notificationIcon(selectedNotification)}
              </span>
              <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{selectedNotification.kind}</span>
              {selectedNotification.priority === "urgent" && <span className="rounded-full bg-error-50 px-2 py-1 text-xs font-semibold text-error-600 dark:bg-error-500/10 dark:text-error-400">Urgent</span>}
            </div>
            <button type="button" onClick={clearSelection} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Back to all</button>
          </div>
          <h2 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{selectedNotification.title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{selectedNotification.description}</p>
          <time dateTime={selectedNotification.createdAt} className="mt-4 block text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedNotification.createdAt)}</time>
          <Link href={selectedNotification.href} className="mt-5 inline-flex rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            Open {selectedNotification.kind}
          </Link>
        </section>
      )}

      <section>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Notification filters">
          {(["all", "urgent", "appointment", "payment", "customer"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize ${filter === option ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`}
            >
              {option === "all" ? `All (${notifications.length})` : option === "urgent" ? `Urgent (${notifications.filter((notification) => notification.priority === "urgent").length})` : `${option}s`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{error}</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No notifications in this view.</p>
        ) : (
          <ul className="divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {filteredNotifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => selectNotification(notification)}
                  aria-pressed={notification.id === selectedId}
                  className={`flex w-full items-start gap-4 px-3 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] sm:px-4 ${notification.id === selectedId ? "bg-brand-50/60 dark:bg-brand-500/5" : ""}`}
                >
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notification.priority === "urgent" ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                    {notificationIcon(notification)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-gray-800 dark:text-white/90">{notification.title}</span>
                      <time dateTime={notification.createdAt} className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notification.createdAt)}</time>
                    </span>
                    <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">{notification.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}