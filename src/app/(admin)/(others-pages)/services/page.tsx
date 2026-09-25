"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import React, { useEffect, useState } from "react";

type ServiceCategory = { id: string; name: string };

type ServiceRecord = {
  id: string;
  name: string;
  category: string;
  duration: string;
  durationMinutes: number | null;
  price: string;
  priceNaira: number;
  status: string;
  color: string;
};

type ApiService = {
  id: string;
  name: string;
  durationMinutes: number | null;
  priceKobo: number;
  isActive: boolean;
  category: { id: string; name: string };
};

function toServiceRecord(service: ApiService): ServiceRecord {
  const priceNaira = service.priceKobo / 100;
  return {
    id: service.id,
    name: service.name,
    category: service.category.name,
    duration: service.durationMinutes === null ? "Not set" : `${service.durationMinutes} min`,
    durationMinutes: service.durationMinutes,
    price: `₦${priceNaira.toLocaleString("en-NG")}`,
    priceNaira,
    status: service.isActive ? "Active" : "Inactive",
    color: service.isActive ? "success" : "error",
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isCategoryCreating, setIsCategoryCreating] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [priceNaira, setPriceNaira] = useState("25000");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const servicesWithDuration = services.filter((service) => service.durationMinutes !== null);
  const averageDuration = servicesWithDuration.length
    ? Math.round(servicesWithDuration.reduce((total, service) => total + (service.durationMinutes ?? 0), 0) / servicesWithDuration.length)
    : 0;
  const averagePrice = services.length
    ? Math.round(services.reduce((total, service) => total + service.priceNaira, 0) / services.length)
    : 0;

  useEffect(() => {
    void Promise.all([refreshCategories(), refreshServices()]).catch((error) => {
      setPageError(error instanceof Error ? error.message : "Unable to load service catalog.");
    });
  }, []);

  async function refreshServices() {
    setIsLoadingServices(true);
    setPageError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
      });
      if (!response.ok) throw new Error("Unable to load services. Please sign in again if your session has expired.");
      const nextServices = (await response.json()) as ApiService[];
      setServices(nextServices.map(toServiceRecord));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load services.");
    } finally {
      setIsLoadingServices(false);
    }
  }

  async function refreshCategories() {
    const response = await fetch(`${API_BASE_URL}/api/services/categories`, {
      headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
    });

    if (!response.ok) throw new Error("Unable to refresh categories.");

    const nextCategories = (await response.json()) as ServiceCategory[];
    setCategories(nextCategories);
    return nextCategories;
  }

  async function createServiceCategory() {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setCreateError("Category name is required.");
      return;
    }

    setCreateError("");
    setIsCategoryCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/services/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmed,
          description: categoryDescription.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create category.");
      }

      const nextCategories = await refreshCategories();
      const createdCategory = nextCategories.find((category) => category.name.toLowerCase() === trimmed.toLowerCase());
      if (createdCategory) {
        setCategoryId(createdCategory.id);
      }
      setCategoryName("");
      setCategoryDescription("");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create category.");
    } finally {
      setIsCategoryCreating(false);
    }
  }

  const resetServiceForm = () => {
    setName("");
    setCategoryId("");
    setCategoryName("");
    setCategoryDescription("");
    setDurationMinutes("60");
    setPriceNaira("25000");
    setEditingId(null);
  };

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    setIsCreating(true);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, categoryId, durationMinutes: Number(durationMinutes), priceNaira: Number(priceNaira) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create service.");
      await refreshServices();
      resetServiceForm();
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create service.");
    } finally {
      setIsCreating(false);
    }
  }

  async function updateService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setCreateError("");
    setIsSaving(true);

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/services/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          categoryId,
          ...(durationMinutes.trim() ? { durationMinutes: Number(durationMinutes) } : {}),
          priceNaira: Number(priceNaira),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to update service.");
      }

      await refreshServices();

      resetServiceForm();
      setIsEditOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to update service.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteService(serviceId?: string, serviceName?: string) {
    if (!serviceId || !window.confirm(`Delete ${serviceName ?? "this service"}?`)) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setCreateError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to delete service.");
      }

      await refreshServices();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to delete service.");
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Services" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active treatments</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{services.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. duration</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{averageDuration ? `${averageDuration} min` : "-"}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Revenue per slot</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{averagePrice ? `₦${averagePrice.toLocaleString("en-NG")}` : "-"}</p>
        </div>
      </div>

      <ComponentCard
        title="Service catalog"
        desc="Current offerings, pricing, and treatment availability."
      >
        {pageError && <p role="alert" className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{pageError}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search services"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:w-72"
            />
          </div>
          <Button size="sm" onClick={() => { setCreateError(""); setIsCreateOpen(true); }}>Add service</Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-[720px] w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {isLoadingServices ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Loading services...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">{pageError ? "Services could not be loaded." : "No active services found."}</td></tr>
              ) : services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{service.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.duration}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.price}</td>
                  <td className="px-4 py-4 text-sm">
                    <Badge variant="light" color={service.color as any}>{service.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(service.id ?? null);
                          setName(service.name);
                          setCategoryId(categories.find((category) => category.name === service.category)?.id ?? "");
                          setDurationMinutes(service.durationMinutes === null ? "" : String(service.durationMinutes));
                          setPriceNaira(String(service.priceNaira));
                          setIsEditOpen(true);
                        }}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id, service.name)}
                        className="text-error-500 hover:text-error-600 dark:text-error-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ComponentCard>

      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true">
          <form onSubmit={isEditOpen ? updateService : createService} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{isEditOpen ? "Edit service" : "Add service"}</h2>
            {createError && <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{createError}</p>}
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Service name" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            <select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>

            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Need a new category?</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category name" className="h-11 rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                <button type="button" onClick={createServiceCategory} disabled={isCategoryCreating} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70">{isCategoryCreating ? "Saving..." : "Add category"}</button>
              </div>
              <input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Category description (optional)" className="mt-3 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4"><input required={!isEditOpen} type="number" min="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} placeholder="Duration (minutes)" className="h-11 rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><input required type="number" min="0" value={priceNaira} onChange={(event) => setPriceNaira(event.target.value)} placeholder="Price (NGN)" className="h-11 rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" /></div>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetServiceForm(); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><Button size="sm" type="submit" disabled={isCreating || isSaving}>{isCreating || isSaving ? (isEditOpen ? "Saving..." : "Creating...") : isEditOpen ? "Save changes" : "Create service"}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
