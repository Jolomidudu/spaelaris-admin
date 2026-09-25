"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type Room = { id: string; name: string; description?: string | null; isActive: boolean; location?: { name: string; city: string } };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [locationSlug, setLocationSlug] = useState("lagos");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/rooms`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load rooms.");
        setRooms((await response.json()) as Room[]);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load rooms."));
  }, []);

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken() ?? ""}` },
        body: JSON.stringify({ name, locationSlug, description: description || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create room.");
      setRooms((current) => [...current, payload as Room]);
      setName("");
      setDescription("");
      setIsCreateOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create room.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Rooms" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Treatment rooms</h2><button type="button" onClick={() => setIsCreateOpen(true)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">Add room</button></div>
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
      {isCreateOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true"><form onSubmit={createRoom} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add treatment room</h2><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Room name" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><select value={locationSlug} onChange={(event) => setLocationSlug(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="lagos">Spaelaris Lagos</option><option value="abuja">Spaelaris Abuja</option></select><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="min-h-24 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button type="submit" disabled={isCreating} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{isCreating ? "Creating..." : "Create room"}</button></div></form></div>}
    </div>
  );
}
