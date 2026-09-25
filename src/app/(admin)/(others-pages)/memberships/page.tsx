"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type Membership = { id: string; status: string; startsAt: string; endsAt?: string | null; customer?: { firstName: string; lastName: string; phone: string }; package?: { name: string } };
type CustomerOption = { id: string; firstName: string; lastName: string; phone: string };
type PackageOption = { id: string; name: string };

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 10));
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/memberships`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load memberships."); setMemberships((await response.json()) as Membership[]); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load memberships."));
    fetch(`${API_BASE_URL}/api/customers`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => { if (response.ok) setCustomers((await response.json()) as CustomerOption[]); })
      .catch(() => undefined);
    fetch(`${API_BASE_URL}/api/packages`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => { if (response.ok) setPackages((await response.json()) as PackageOption[]); })
      .catch(() => undefined);
  }, []);

  async function createMembership(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/memberships`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken() ?? ""}` }, body: JSON.stringify({ customerId, packageId, startsAt }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to assign membership.");
      setMemberships((current) => [payload as Membership, ...current]);
      setCustomerId(""); setPackageId(""); setIsCreateOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to assign membership.");
    } finally { setIsCreating(false); }
  }
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Memberships" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Active memberships</h2><button type="button" onClick={() => setIsCreateOpen(true)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">Assign membership</button></div>{error && <p className="mt-4 text-sm text-error-600">{error}</p>}{!error && memberships.length === 0 && <p className="mt-4 text-sm text-gray-500">No memberships found.</p>}<div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Package</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Starts</th></tr></thead><tbody>{memberships.map((item) => <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800"><td className="px-3 py-3">{item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : "-"}</td><td className="px-3 py-3">{item.package?.name ?? "-"}</td><td className="px-3 py-3">{item.status}</td><td className="px-3 py-3">{new Date(item.startsAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>
      {isCreateOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true"><form onSubmit={createMembership} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Assign membership</h2><select required value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName} · {customer.phone}</option>)}</select><select required value={packageId} onChange={(event) => setPackageId(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="">Select package</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input required type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button type="submit" disabled={isCreating} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{isCreating ? "Assigning..." : "Assign membership"}</button></div></form></div>}
    </div>
  );
}
