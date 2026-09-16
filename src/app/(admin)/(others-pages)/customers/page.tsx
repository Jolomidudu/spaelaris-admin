"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { getAccessToken } from "@/lib/auth";
import React from "react";
import { useEffect, useState } from "react";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  createdAt: string;
  _count: {
    appointments: number;
    memberships: number;
  };
  appointments: {
    startsAt: string;
    status: string;
  }[];
  memberships: {
    id: string;
    status: string;
    package: { name: string };
  }[];
};

function formatDate(value: string | undefined) {
  if (!value) return "No visits yet";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

function getStatusClasses(status: string) {
  return status === "Returning"
    ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
    : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500";
}

export default function CustomerDirectoryPage() {
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      const token = getAccessToken();

      if (!token) {
        setError("Your session has expired. Please sign in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/api/customers", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Unable to load customer records.");
        setCustomerData((await response.json()) as Customer[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load customer records.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadCustomers();
  }, []);

  async function handleCreateCustomer(event: React.FormEvent<HTMLFormElement>) {
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
      const response = await fetch("http://localhost:3001/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, phone, email: email || undefined }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create customer.");
      }

      const refreshResponse = await fetch("http://localhost:3001/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!refreshResponse.ok) throw new Error("Customer was created, but the directory could not refresh.");

      setCustomerData((await refreshResponse.json()) as Customer[]);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setIsCreateOpen(false);
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : "Unable to create customer.");
    } finally {
      setIsCreating(false);
    }
  }

  const returningCustomers = customerData.filter((customer) => customer._count.appointments > 1).length;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Customers" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total customers</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{customerData.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Returning guests</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{returningCustomers}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">This month</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">-</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Customer directory</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visit history and active memberships</p>
          </div>
          <button type="button" onClick={() => { setCreateError(""); setIsCreateOpen(true); }} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">Add customer</button>
        </div>

        {error && <p className="px-5 py-4 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {isLoading && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Loading customer records...</p>}
        {!isLoading && !error && customerData.length === 0 && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No customers found.</p>}

        {!isLoading && !error && customerData.length > 0 && <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Visits</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Last visit</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tier</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {customerData.map((customer) => {
                const status = customer._count.appointments > 1 ? "Returning" : "New";
                const membership = customer.memberships[0]?.package.name ?? "No membership";

                return (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{customer.firstName} {customer.lastName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email ?? "No email"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.phone}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{customer._count.appointments}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(customer.appointments[0]?.startsAt)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{membership}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
                      {status}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true" aria-labelledby="create-customer-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 id="create-customer-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Add customer</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a guest profile for future bookings.</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              {createError && <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{createError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Amaka" required />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Okafor" required />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234 812 123 4567" type="tel" required />
              </div>
              <div>
                <Label>Email <span className="text-gray-400">(optional)</span></Label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="amaka@example.com" type="email" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating}>{isCreating ? "Creating..." : "Create customer"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
