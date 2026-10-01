"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, CreditCard, UserRound } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken, subscribeToAuthChanges } from "@/lib/auth";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type Notification = {
  id: string;
  kind: "appointment" | "payment" | "customer";
  title: string;
  description: string;
  createdAt: string;
  href: string;
  priority: "urgent" | "normal";
};

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString();
}

function NotificationIcon({ notification }: { notification: Notification }) {
  if (notification.priority === "urgent") return <AlertTriangle size={18} aria-hidden="true" />;
  if (notification.kind === "appointment") return <CalendarDays size={18} aria-hidden="true" />;
  if (notification.kind === "payment") return <CreditCard size={18} aria-hidden="true" />;
  return <UserRound size={18} aria-hidden="true" />;
}

export default function NotificationsMenu() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      const token = getAccessToken();
      if (!token) {
        if (isMounted) {
          setNotifications([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to load notifications.");
        }
        if (isMounted) {
          setNotifications(payload as Notification[]);
          setError("");
        }
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadNotifications();
    const intervalId = window.setInterval(() => void loadNotifications(), 60_000);
    const unsubscribe = subscribeToAuthChanges(() => void loadNotifications());
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  const hasRecentNotifications = notifications.some((notification) => Date.now() - new Date(notification.createdAt).getTime() < 24 * 60 * 60 * 1000);

  function toggleDropdown() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const width = Math.min(361, viewportWidth - 16);
    const maxRight = Math.max(8, viewportWidth - width - 8);
    const requestedRight = rect ? viewportWidth - rect.right : 8;
    const right = Math.min(Math.max(requestedRight, 8), maxRight);
    const top = Math.min(rect ? rect.bottom + 8 : 80, Math.max(8, window.innerHeight - 240));
    const height = Math.max(180, Math.min(480, window.innerHeight - top - 8));

    setPosition({ position: "fixed", top, right, width, height, marginTop: 0 });
    setIsOpen(true);
  }

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {hasRecentNotifications && <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" /></span>}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" fill="currentColor" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        style={position}
        className="mt-[17px] flex max-h-[70vh] min-h-[180px] max-w-[361px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
          <button type="button" onClick={closeDropdown} aria-label="Close notifications" className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
            <svg className="fill-current" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <ul className="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
          {isLoading ? (
            <li className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading notifications...</li>
          ) : error ? (
            <li role="alert" className="rounded-lg bg-error-50 px-3 py-3 text-sm text-error-600">{error}</li>
          ) : notifications.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No recent activity or urgent items.</li>
          ) : notifications.map((notification) => (
            <li key={notification.id}>
              <DropdownItem
                tag="a"
                href={`/notifications?selected=${encodeURIComponent(notification.id)}`}
                onItemClick={closeDropdown}
                className="flex items-start gap-3 rounded-lg border-b border-gray-100 px-3 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${notification.priority === "urgent" ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                  <NotificationIcon notification={notification} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">{notification.title}</span>
                    {notification.priority === "urgent" && <span className="shrink-0 text-[10px] font-semibold uppercase text-error-600 dark:text-error-400">Urgent</span>}
                  </span>
                  <span className="mt-1 block text-xs text-gray-600 dark:text-gray-300">{notification.description}</span>
                  <time dateTime={notification.createdAt} className="mt-1.5 block text-xs text-gray-400">{relativeTime(notification.createdAt)}</time>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>
        <Link href="/notifications" onClick={closeDropdown} className="mt-3 block rounded-lg border border-gray-200 px-3 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          View all notifications
        </Link>
      </Dropdown>
    </div>
  );
}