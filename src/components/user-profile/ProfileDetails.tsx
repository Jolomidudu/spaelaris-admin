"use client";

import Image from "next/image";
import React, { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken, getStoredAuth, saveAuthSession, subscribeToAuthChanges } from "@/lib/auth";

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  bio: string | null;
  photoUrl: string | null;
  country: string | null;
  cityState: string | null;
  postalCode: string | null;
  taxId: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
};

type ProfileForm = Omit<UserProfile, "id" | "role">;
type Editor = "personal" | "address" | "social" | null;

const emptyForm: ProfileForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  bio: "",
  photoUrl: "",
  country: "",
  cityState: "",
  postalCode: "",
  taxId: "",
  facebookUrl: "",
  xUrl: "",
  linkedinUrl: "",
  instagramUrl: "",
};

const inputClassName = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function formatRole(role: string) {
  return role.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toProfileForm(profile: UserProfile): ProfileForm {
  return {
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone ?? "",
    bio: profile.bio ?? "",
    photoUrl: profile.photoUrl ?? "",
    country: profile.country ?? "",
    cityState: profile.cityState ?? "",
    postalCode: profile.postalCode ?? "",
    taxId: profile.taxId ?? "",
    facebookUrl: profile.facebookUrl ?? "",
    xUrl: profile.xUrl ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    instagramUrl: profile.instagramUrl ?? "",
  };
}

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to update your profile.");
  }
  return payload;
}

async function compressPhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    for (let maxSide = 512; maxSide >= 128; maxSide = Math.floor(maxSide * 0.75)) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to prepare the selected image.");
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
  throw new Error("This image could not be compressed enough. Choose a simpler image.");
}

export default function ProfileDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const token = getAccessToken();
      if (!token) {
        if (isMounted) {
          setProfile(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nextProfile = await readResponse(response) as UserProfile;
        if (isMounted) {
          setProfile(nextProfile);
          setForm(toProfileForm(nextProfile));
          setPageError("");
        }
      } catch (error) {
        if (isMounted) setPageError(error instanceof Error ? error.message : "Unable to load your profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadProfile();
    const unsubscribe = subscribeToAuthChanges(() => void loadProfile());
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  async function saveProfile(changes: Partial<ProfileForm>) {
    const token = getAccessToken();
    if (!token) {
      setPageError("Your session has expired. Please sign in again.");
      return false;
    }

    setPageError("");
    setSuccessMessage("");
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      const nextProfile = await readResponse(response) as UserProfile;
      setProfile(nextProfile);
      setForm(toProfileForm(nextProfile));
      const session = getStoredAuth();
      if (session) {
        saveAuthSession({
          ...session,
          user: {
            ...session.user,
            firstName: nextProfile.firstName,
            lastName: nextProfile.lastName,
            email: nextProfile.email,
            role: nextProfile.role,
          },
        });
      }
      setSuccessMessage("Profile updated.");
      setEditor(null);
      return true;
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update your profile.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPageError("Choose an image file.");
      return;
    }
    if (file.size > 5_000_000) {
      setPageError("Choose an image smaller than 5 MB.");
      return;
    }

    try {
      const photoUrl = await compressPhoto(file);
      await saveProfile({ photoUrl });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to prepare the selected image.");
    }
  }

  async function handleSaveSection(event: FormEvent<HTMLFormElement>, section: Exclude<Editor, null>) {
    event.preventDefault();
    const fields: Record<Exclude<Editor, null>, (keyof ProfileForm)[]> = {
      personal: ["firstName", "lastName", "email", "phone", "bio"],
      address: ["country", "cityState", "postalCode", "taxId"],
      social: ["facebookUrl", "xUrl", "linkedinUrl", "instagramUrl"],
    };
    const changes = Object.fromEntries(fields[section].map((key) => [key, form[key]]));
    await saveProfile(changes);
  }

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  if (isLoading) return <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>;
  if (!profile) return <p role="alert" className="text-sm text-error-600">{pageError || "No signed-in user was found."}</p>;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Name not provided";
  const initials = [profile.firstName, profile.lastName].filter(Boolean).map((name) => name.charAt(0).toUpperCase()).join("") || "U";

  return (
    <div className="space-y-6">
      {(pageError || successMessage) && (
        <p role={pageError ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${pageError ? "bg-error-50 text-error-600" : "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"}`}>
          {pageError || successMessage}
        </p>
      )}

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {profile.photoUrl ? (
            <Image src={profile.photoUrl} alt={`${fullName} profile`} width={88} height={88} unoptimized className="h-[88px] w-[88px] rounded-full object-cover" />
          ) : (
            <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300" aria-hidden="true">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{fullName}</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatRole(profile.role)}</p>
            <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.03]">
              {isSaving ? "Saving..." : "Update photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={isSaving} className="sr-only" />
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, or WebP up to 5 MB</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Personal Information</h4>
          <button type="button" onClick={() => setEditor(editor === "personal" ? null : "personal")} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            {editor === "personal" ? "Cancel" : "Edit"}
          </button>
        </div>
        {editor === "personal" ? (
          <form onSubmit={(event) => void handleSaveSection(event, "personal")} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">First name<input required value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Last name<input required value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Email address<input required type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Phone<input type="tel" value={form.phone ?? ""} onChange={(event) => updateField("phone", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">Bio<textarea rows={3} value={form.bio ?? ""} onChange={(event) => updateField("bio", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></label>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{isSaving ? "Saving..." : "Save personal information"}</button></div>
          </form>
        ) : (
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <ProfileValue label="First name" value={profile.firstName} />
            <ProfileValue label="Last name" value={profile.lastName} />
            <ProfileValue label="Email address" value={profile.email} />
            <ProfileValue label="Phone" value={profile.phone} />
            <ProfileValue label="Bio" value={profile.bio} />
            <ProfileValue label="Role" value={formatRole(profile.role)} />
          </dl>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Address</h4>
          <button type="button" onClick={() => setEditor(editor === "address" ? null : "address")} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            {editor === "address" ? "Cancel" : "Edit"}
          </button>
        </div>
        {editor === "address" ? (
          <form onSubmit={(event) => void handleSaveSection(event, "address")} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Country<input value={form.country ?? ""} onChange={(event) => updateField("country", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">City/State<input value={form.cityState ?? ""} onChange={(event) => updateField("cityState", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Postal code<input value={form.postalCode ?? ""} onChange={(event) => updateField("postalCode", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Tax ID<input value={form.taxId ?? ""} onChange={(event) => updateField("taxId", event.target.value)} className={inputClassName} /></label>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{isSaving ? "Saving..." : "Save address"}</button></div>
          </form>
        ) : (
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <ProfileValue label="Country" value={profile.country} />
            <ProfileValue label="City/State" value={profile.cityState} />
            <ProfileValue label="Postal code" value={profile.postalCode} />
            <ProfileValue label="Tax ID" value={profile.taxId} />
          </dl>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Social Links</h4>
          <button type="button" onClick={() => setEditor(editor === "social" ? null : "social")} className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            {editor === "social" ? "Cancel" : "Edit"}
          </button>
        </div>
        {editor === "social" ? (
          <form onSubmit={(event) => void handleSaveSection(event, "social")} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Facebook<input type="url" value={form.facebookUrl ?? ""} onChange={(event) => updateField("facebookUrl", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">X<input type="url" value={form.xUrl ?? ""} onChange={(event) => updateField("xUrl", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">LinkedIn<input type="url" value={form.linkedinUrl ?? ""} onChange={(event) => updateField("linkedinUrl", event.target.value)} className={inputClassName} /></label>
              <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Instagram<input type="url" value={form.instagramUrl ?? ""} onChange={(event) => updateField("instagramUrl", event.target.value)} className={inputClassName} /></label>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{isSaving ? "Saving..." : "Save social links"}</button></div>
          </form>
        ) : (
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <ProfileValue label="Facebook" value={profile.facebookUrl} />
            <ProfileValue label="X" value={profile.xUrl} />
            <ProfileValue label="LinkedIn" value={profile.linkedinUrl} />
            <ProfileValue label="Instagram" value={profile.instagramUrl} />
          </dl>
        )}
      </section>

    </div>
  );
}

function ProfileValue({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">{value || "Not provided"}</dd>
    </div>
  );
}