"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type Room = {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  isActive: boolean;
  location?: { id?: string; name: string; slug: string; city: string };
};

const inputClassName = "h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white";

async function compressRoomPhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    for (let maxSide = 1200; maxSide >= 192; maxSide = Math.floor(maxSide * 0.75)) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to prepare this image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (let quality = 0.82; quality >= 0.42; quality -= 0.1) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= 68_000) return dataUrl;
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error("This image could not be compressed enough. Choose another image.");
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [name, setName] = useState("");
  const [locationSlug, setLocationSlug] = useState("lagos");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadRooms() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rooms`, {
          headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to load rooms.");
        if (isMounted) setRooms(payload as Room[]);
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Unable to load rooms.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadRooms();
    return () => {
      isMounted = false;
    };
  }, []);

  function openCreateForm() {
    setEditingRoom(null);
    setName("");
    setLocationSlug("lagos");
    setDescription("");
    setPhotoUrl("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(room: Room) {
    setEditingRoom(room);
    setName(room.name);
    setLocationSlug(room.location?.slug ?? "lagos");
    setDescription(room.description ?? "");
    setPhotoUrl(room.photoUrl ?? "");
    setError("");
    setIsFormOpen(true);
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 5_000_000) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }

    setError("");
    try {
      setPhotoUrl(await compressRoomPhoto(file));
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : "Unable to prepare this image.");
    }
  }

  async function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");

      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: editingRoom ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          locationSlug,
          description: description.trim() || (editingRoom ? null : undefined),
          photoUrl: photoUrl || (editingRoom ? null : undefined),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to save room.");
      setRooms((current) => editingRoom
        ? current.map((room) => room.id === editingRoom.id ? payload as Room : room)
        : [...current, payload as Room]);
      setIsFormOpen(false);
      setEditingRoom(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save room.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRoom(room: Room) {
    if (!window.confirm(`Delete ${room.name}?`)) return;
    const token = getAccessToken();
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${room.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to delete room.");
      setRooms((current) => current.filter((item) => item.id !== room.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete room.");
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Rooms" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Treatment rooms</h2><button type="button" onClick={openCreateForm} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">Add room</button></div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{error}</p>}
        {isLoading ? <p className="mt-5 text-sm text-gray-500">Loading rooms...</p> : rooms.length === 0 && <p className="mt-5 text-sm text-gray-500">No rooms found.</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              {room.photoUrl ? (
                <Image src={room.photoUrl} alt={`${room.name} room`} width={720} height={400} unoptimized className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">No room photo</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white/90">{room.name}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{room.location?.name ?? "Spaelaris"} · {room.location?.city ?? ""}</p>
                  </div>
                  <div className="flex shrink-0 gap-3 text-sm">
                    <button type="button" onClick={() => openEditForm(room)} className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Edit</button>
                    <button type="button" onClick={() => void deleteRoom(room)} className="font-medium text-error-600 hover:text-error-700 dark:text-error-400">Delete</button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{room.description || "Ready for bookings"}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="room-form-title">
          <form onSubmit={(event) => void saveRoom(event)} className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 id="room-form-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">{editingRoom ? "Edit treatment room" : "Add treatment room"}</h2>
            {error && <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{error}</p>}
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Room name" className={inputClassName} />
            <select value={locationSlug} onChange={(event) => setLocationSlug(event.target.value)} className={inputClassName}>
              <option value="lagos">Spaelaris Lagos</option>
              <option value="abuja">Spaelaris Abuja</option>
            </select>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="min-h-24 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="room-photo">Room photo</label>
              {photoUrl && <Image src={photoUrl} alt="Room photo preview" width={720} height={400} unoptimized className="mt-2 h-40 w-full rounded-lg object-cover" />}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input id="room-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handlePhotoChange(event)} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-gray-300 dark:file:bg-gray-800" />
                {photoUrl && <button type="button" onClick={() => setPhotoUrl("")} className="text-sm font-medium text-error-600 hover:text-error-700 dark:text-error-400">Remove photo</button>}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, or WebP up to 5 MB. Images are compressed before upload.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setIsFormOpen(false); setEditingRoom(null); setError(""); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button>
              <button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{isSaving ? "Saving..." : editingRoom ? "Save changes" : "Create room"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
