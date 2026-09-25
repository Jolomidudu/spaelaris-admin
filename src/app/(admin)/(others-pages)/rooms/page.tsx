"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type Room = { id: string; name: string; description?: string | null; isActive: boolean; location?: { name: string; city: string } };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/rooms`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load rooms.");
        setRooms((await response.json()) as Room[]);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load rooms."));
  }, []);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Rooms" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Treatment rooms</h2>
        {error && <p className="mt-4 text-sm text-error-600">{error}</p>}
        {!error && rooms.length === 0 && <p className="mt-4 text-sm text-gray-500">No rooms found.</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="font-medium text-gray-800 dark:text-white/90">{room.name}</p>
              <p className="mt-1 text-sm text-gray-500">{room.location?.name ?? "Spaelaris"} · {room.location?.city ?? ""}</p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{room.description || "Ready for bookings"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
