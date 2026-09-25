"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type PackageItem = { id: string; name: string; description?: string | null; priceKobo: number; status: string; validityDays?: number | null; services?: { service: { name: string } }[] };

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/packages`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load packages."); setPackages((await response.json()) as PackageItem[]); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load packages."));
  }, []);
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Packages" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Spa packages</h2>
        {error && <p className="mt-4 text-sm text-error-600">{error}</p>}
        {!error && packages.length === 0 && <p className="mt-4 text-sm text-gray-500">No packages found.</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {packages.map((item) => <div key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="font-medium text-gray-800 dark:text-white/90">{item.name}</p><p className="mt-2 text-sm text-gray-500">₦{(item.priceKobo / 100).toLocaleString()} · {item.status}</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.description || "Curated Spaelaris treatment package."}</p></div>)}
        </div>
      </div>
    </div>
  );
}
