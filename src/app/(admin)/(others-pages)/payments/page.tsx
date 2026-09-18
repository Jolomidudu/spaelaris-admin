"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import React, { useEffect, useState } from "react";

type Payment = {
  id: string;
  appointmentId: string;
  reference: string;
  amountKobo: number;
  status: string;
  method: string;
  paidAt: string | null;
  createdAt: string;
  appointment: {
    startsAt: string;
    customer: { firstName: string; lastName: string; phone: string };
    services: { name: string }[];
  };
};

function formatMoney(amountKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

function statusClasses(status: string) {
  if (status === "PAID") return "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";
  if (status === "FAILED" || status === "REFUNDED") return "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400";
  return "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500";
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");

  useEffect(() => {
    async function loadPayments() {
      const token = getAccessToken();
      if (!token) {
        setError("Your session has expired. Please sign in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Unable to load payment records.");
        setPayments((await response.json()) as Payment[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load payment records.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPayments();
  }, []);

  async function refreshPayments() {
    const token = getAccessToken();
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    const response = await fetch(`${API_BASE_URL}/api/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Unable to refresh payment records.");
    setPayments((await response.json()) as Payment[]);
  }

  async function handleCreatePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      const token = getAccessToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appointmentId, reference, amountKobo: Math.round(Number(amount) * 100), method }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to record payment.");
      await refreshPayments();
      setAppointmentId("");
      setReference("");
      setAmount("");
      setMethod("CASH");
      setIsCreateOpen(false);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to record payment.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updatePaymentStatus(id: string, status: string) {
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch(`${API_BASE_URL}/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Unable to update payment.");
      await refreshPayments();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update payment.");
    }
  }

  const paidAmount = payments.filter((payment) => payment.status === "PAID").reduce((total, payment) => total + payment.amountKobo, 0);
  const pendingAmount = payments.filter((payment) => payment.status === "PENDING").reduce((total, payment) => total + payment.amountKobo, 0);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Payments" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{formatMoney(paidAmount)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending reconciliation</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{formatMoney(pendingAmount)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{payments.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Transaction ledger</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Payment status and appointment context for reconciliation</p>
          </div>
          <button type="button" onClick={() => { setFormError(""); setIsCreateOpen(true); }} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">Record payment</button>
        </div>

        {error && <p className="px-5 py-4 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {isLoading && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Loading payment records...</p>}
        {!isLoading && !error && payments.length === 0 && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No payment transactions found.</p>}

        {!isLoading && !error && payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Appointment</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Reference</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Method</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-900">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800 dark:text-white/90">{payment.appointment.customer.firstName} {payment.appointment.customer.lastName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{payment.appointment.customer.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(payment.appointment.startsAt)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{payment.appointment.services.map((service) => service.name).join(", ")}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{payment.reference}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{formatMoney(payment.amountKobo)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{payment.method.replace("_", " ")}</td>
                    <td className="px-5 py-4">
                      <select value={payment.status} onChange={(event) => void updatePaymentStatus(payment.id, event.target.value)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${statusClasses(payment.status)}`}>
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="FAILED">FAILED</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true" aria-labelledby="record-payment-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 id="record-payment-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Record payment</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Attach a manual transaction to an appointment.</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Close</button>
            </div>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              {formError && <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{formError}</p>}
              <label className="block text-sm text-gray-600 dark:text-gray-300">Appointment ID<input value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} required placeholder="ck..." className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900" /></label>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Reference<input value={reference} onChange={(event) => setReference(event.target.value)} required placeholder="POS-20260917-001" className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900" /></label>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Amount (NGN)<input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="45000" className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900" /></label>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Method<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900"><option value="CASH">Cash</option><option value="POS">POS</option><option value="BANK_TRANSFER">Bank transfer</option><option value="PAYSTACK">Paystack</option></select></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:text-gray-300">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{isSaving ? "Saving..." : "Record payment"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
