"use client";

import React, { useState, type FormEvent } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const inputClassName = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function AccountSecurity() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to change your password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Unable to change your password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Password</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use your current password to set a new one.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">{message}</p>}
      <form onSubmit={(event) => void changePassword(event)} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClassName} /></label>
          <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400">New password<input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClassName} /></label>
          <label className="space-y-1 text-xs text-gray-500 dark:text-gray-400 sm:col-span-2 xl:col-span-1">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClassName} /></label>
        </div>
        <div className="flex justify-end"><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{isSaving ? "Updating..." : "Update password"}</button></div>
      </form>
    </section>
  );
}