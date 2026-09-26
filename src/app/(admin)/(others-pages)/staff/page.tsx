"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import React from "react";
import { useEffect, useState } from "react";

type StaffMember = {
  id: string;
  bio: string | null;
  isBookable: boolean;
  availability: AvailabilityPeriod[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  location: {
    name: string;
    city: string;
  };
  services: {
    service: {
      name: string;
    };
  }[];
};

type AvailabilityPeriod = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getStatusClasses(status: string) {
  if (status === "Bookable") {
    return "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";
  }

  if (status === "In session") {
    return "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500";
  }

  return "bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300";
}

function formatAvailability(periods: AvailabilityPeriod[]) {
  return weekdays.flatMap((day, dayOfWeek) => {
    const dayPeriods = periods
      .filter((period) => period.dayOfWeek === dayOfWeek)
      .sort((first, second) => first.startTime.localeCompare(second.startTime));
    if (dayPeriods.length === 0) return [];
    return [`${day.slice(0, 3)} ${dayPeriods.map(({ startTime, endTime }) => `${startTime}-${endTime}`).join(", ")}`];
  });
}

export default function StaffDirectoryPage() {
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [locationSlug, setLocationSlug] = useState("lagos");
  const [serviceSlugs, setServiceSlugs] = useState<string[]>(["deep-tissue-massage"]);
  const [editingAvailability, setEditingAvailability] = useState<StaffMember | null>(null);
  const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilityPeriod[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      const token = getAccessToken();

      if (!token) {
        setError("Your session has expired. Please sign in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/staff`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Unable to load staff records.");
        }

        setStaffData((await response.json()) as StaffMember[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load staff records.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadStaff();
  }, []);

  function toggleService(serviceSlug: string) {
    setServiceSlugs((current) => current.includes(serviceSlug)
      ? current.filter((value) => value !== serviceSlug)
      : [...current, serviceSlug]);
  }

  function openAvailabilityEditor(staff: StaffMember) {
    setEditingAvailability(staff);
    setAvailabilityDraft(staff.availability.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })));
    setAvailabilityError("");
  }

  function updateAvailabilityPeriod(index: number, field: keyof AvailabilityPeriod, value: string | number) {
    setAvailabilityDraft((current) => current.map((period, periodIndex) =>
      periodIndex === index ? { ...period, [field]: value } : period,
    ));
  }

  async function saveAvailability(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAvailability) return;
    setAvailabilityError("");
    setIsSavingAvailability(true);
    const token = getAccessToken();
    if (!token) {
      setAvailabilityError("Your session has expired. Please sign in again.");
      setIsSavingAvailability(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/${editingAvailability.id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability: availabilityDraft }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to save therapist availability.");
      }
      setStaffData((current) => current.map((staff) => staff.id === editingAvailability.id
        ? { ...staff, availability: payload as AvailabilityPeriod[] }
        : staff,
      ));
      setEditingAvailability(null);
    } catch (saveError) {
      setAvailabilityError(saveError instanceof Error ? saveError.message : "Unable to save therapist availability.");
    } finally {
      setIsSavingAvailability(false);
    }
  }

  async function handleCreateStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    setIsCreating(true);

    const token = getAccessToken();
    if (!token) {
      setCreateError("Your session has expired. Please sign in again.");
      setIsCreating(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, email, phone: phone || undefined, locationSlug, serviceSlugs }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create staff member.");
      }

      const refreshResponse = await fetch(`${API_BASE_URL}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!refreshResponse.ok) throw new Error("Staff member was created, but the directory could not refresh.");

      setStaffData((await refreshResponse.json()) as StaffMember[]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setLocationSlug("lagos");
      setServiceSlugs(["deep-tissue-massage"]);
      setIsCreateOpen(false);
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : "Unable to create staff member.");
    } finally {
      setIsCreating(false);
    }
  }

  const therapists = staffData.filter((staff) => staff.user.role === "THERAPIST");
  const bookableCount = therapists.filter((staff) => staff.isBookable).length;
  const unscheduledCount = therapists.filter((staff) => staff.availability.length === 0).length;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Staff & Therapists" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active staff</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{staffData.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Bookable today</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{bookableCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Therapists without hours</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{unscheduledCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Team directory</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Therapist specialties and booking eligibility</p>
          </div>
          <button type="button" onClick={() => { setCreateError(""); setIsCreateOpen(true); }} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">Add staff member</button>
        </div>

        {error && <p className="px-5 py-4 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {isLoading && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Loading staff records...</p>}
        {!isLoading && !error && staffData.length === 0 && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No active staff records found.</p>}

        {!isLoading && !error && staffData.length > 0 && <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Team member</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Services</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Weekly hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {staffData.map((staff) => {
                const status = staff.isBookable ? "Bookable" : "Unavailable";

                return (
                <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{staff.user.firstName} {staff.user.lastName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{staff.user.role}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{staff.location.name}<br />{staff.location.city}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{staff.services.map(({ service }) => service.name).join(", ") || "Not assigned"}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{staff.user.email}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {staff.user.role === "THERAPIST" && <div className="flex min-w-44 items-start justify-between gap-3">
                      {staff.availability.length > 0
                        ? <span className="space-y-1 text-xs text-gray-600 dark:text-gray-300">{formatAvailability(staff.availability).map((period) => <span key={period} className="block">{period}</span>)}</span>
                        : <span className="text-xs text-warning-600 dark:text-warning-500">No hours set</span>}
                      <button type="button" onClick={() => openAvailabilityEditor(staff)} className="shrink-0 font-medium text-brand-500 hover:text-brand-600">Edit</button>
                    </div>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true" aria-labelledby="create-staff-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 id="create-staff-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Add staff member</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a therapist profile for bookings.</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              {createError && <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{createError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>First name</Label><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nneka" required /></div>
                <div><Label>Last name</Label><Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Adeyemi" required /></div>
              </div>
              <div><Label>Email</Label><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="therapist@spaelaris.com" type="email" required /></div>
              <div><Label>Phone <span className="text-gray-400">(optional)</span></Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234 812 123 4567" type="tel" /></div>
              <div>
                <Label>Location</Label>
                <select value={locationSlug} onChange={(event) => setLocationSlug(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option value="lagos">Spaelaris Lagos</option>
                  <option value="abuja">Spaelaris Abuja</option>
                </select>
              </div>
              <div>
                <Label>Services</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[["deep-tissue-massage", "Deep Tissue Massage"], ["glow-facial", "Glow Facial"], ["aromatherapy", "Aromatherapy"]].map(([slug, name]) => (
                    <label key={slug} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <input type="checkbox" checked={serviceSlugs.includes(slug)} onChange={() => toggleService(slug)} />{name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating || serviceSlugs.length === 0}>{isCreating ? "Creating..." : "Create staff member"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAvailability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="availability-title">
          <form onSubmit={saveAvailability} className="max-h-full w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="availability-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Weekly availability</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{editingAvailability.user.firstName} {editingAvailability.user.lastName} · {editingAvailability.location.name}</p>
              </div>
              <button type="button" onClick={() => setEditingAvailability(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            {availabilityError && <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{availabilityError}</p>}
            {availabilityDraft.length === 0 && <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">No weekly hours set. Add the days and hours this therapist accepts appointments.</p>}
            <div className="space-y-3">
              {availabilityDraft.map((period, index) => (
                <div key={`${period.dayOfWeek}-${index}`} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Day<select value={period.dayOfWeek} onChange={(event) => updateAvailabilityPeriod(index, "dayOfWeek", Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">{weekdays.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}</select></label>
                  <label className="text-xs text-gray-500 dark:text-gray-400">From<input type="time" required value={period.startTime} onChange={(event) => updateAvailabilityPeriod(index, "startTime", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></label>
                  <label className="text-xs text-gray-500 dark:text-gray-400">To<input type="time" required value={period.endTime} onChange={(event) => updateAvailabilityPeriod(index, "endTime", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></label>
                  <button type="button" aria-label={`Remove ${weekdays[period.dayOfWeek]} availability`} onClick={() => setAvailabilityDraft((current) => current.filter((_, periodIndex) => periodIndex !== index))} className="h-10 px-3 text-sm text-error-500 hover:text-error-600">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button type="button" onClick={() => setAvailabilityDraft((current) => [...current, { dayOfWeek: 1, startTime: "", endTime: "" }])} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.04]">Add hours</button>
              <div className="flex gap-3"><Button type="button" variant="outline" size="sm" onClick={() => setEditingAvailability(null)}>Cancel</Button><Button type="submit" size="sm" disabled={isSavingAvailability}>{isSavingAvailability ? "Saving..." : "Save availability"}</Button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}