"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type PackageItem = { id: string; name: string; description?: string | null; priceKobo: number; status: string; validityDays?: number | null; services?: { service: { name: string } }[] };
type ServiceOption = { id: string; name: string; slug: string };

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceNaira, setPriceNaira] = useState("50000");
  const [validityDays, setValidityDays] = useState("30");
  const [serviceSlugs, setServiceSlugs] = useState<string[]>([]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/packages`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load packages."); setPackages((await response.json()) as PackageItem[]); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load packages."));
    fetch(`${API_BASE_URL}/api/services`, { headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` } })
      .then(async (response) => { if (!response.ok) throw new Error("Unable to load services."); setServices((await response.json()) as ServiceOption[]); })
      .catch(() => undefined);
  }, []);

  async function createPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/packages`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken() ?? ""}` }, body: JSON.stringify({ name, description: description || undefined, priceNaira: Number(priceNaira), validityDays: Number(validityDays), serviceSlugs }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create package.");
      setPackages((current) => [payload as PackageItem, ...current]);
      setName(""); setDescription(""); setServiceSlugs([]); setIsCreateOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create package.");
    } finally { setIsCreating(false); }
  }
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Packages" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Spa packages</h2><button type="button" onClick={() => setIsCreateOpen(true)} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">Add package</button></div>
        {error && <p className="mt-4 text-sm text-error-600">{error}</p>}
        {!error && packages.length === 0 && <p className="mt-4 text-sm text-gray-500">No packages found.</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {packages.map((item) => <div key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="font-medium text-gray-800 dark:text-white/90">{item.name}</p><p className="mt-2 text-sm text-gray-500">₦{(item.priceKobo / 100).toLocaleString()} · {item.status}</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.description || "Curated Spaelaris treatment package."}</p></div>)}
        </div>
      </div>
      {isCreateOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true"><form onSubmit={createPackage} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add package</h2><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Package name" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="min-h-20 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><div className="grid grid-cols-2 gap-4"><input required type="number" min="0" value={priceNaira} onChange={(event) => setPriceNaira(event.target.value)} placeholder="Price (NGN)" className="h-11 rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><input required type="number" min="1" value={validityDays} onChange={(event) => setValidityDays(event.target.value)} placeholder="Validity days" className="h-11 rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /></div><div className="space-y-2"><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Included services</p>{services.map((service) => <label key={service.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={serviceSlugs.includes(service.slug)} onChange={() => setServiceSlugs((current) => current.includes(service.slug) ? current.filter((slug) => slug !== service.slug) : [...current, service.slug])} />{service.name}</label>)}</div><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button type="submit" disabled={isCreating || serviceSlugs.length === 0} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{isCreating ? "Creating..." : "Create package"}</button></div></form></div>}
    </div>
  );
}
