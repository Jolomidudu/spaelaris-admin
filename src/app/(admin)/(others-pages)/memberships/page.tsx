"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type Membership = { id: string; status: string; startsAt: string; endsAt?: string | null; customer?: { firstName: string; lastName: string; phone: string }; package?: { name: string } };

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/memberships`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load memberships."); setMemberships((await response.json()) as Membership[]); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load memberships."));
  }, []);
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Memberships" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Active memberships</h2>{error && <p className="mt-4 text-sm text-error-600">{error}</p>}{!error && memberships.length === 0 && <p className="mt-4 text-sm text-gray-500">No memberships found.</p>}<div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Package</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Starts</th></tr></thead><tbody>{memberships.map((item) => <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800"><td className="px-3 py-3">{item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : "-"}</td><td className="px-3 py-3">{item.package?.name ?? "-"}</td><td className="px-3 py-3">{item.status}</td><td className="px-3 py-3">{new Date(item.startsAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>
    </div>
  );
}
