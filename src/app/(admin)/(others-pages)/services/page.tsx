"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import React, { useEffect, useState } from "react";

type ServiceCategory = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

type PageView = "catalog" | "categories";

type ServiceRecord = {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  description: string;
  photoUrl: string | null;
  duration: string;
  durationMinutes: number | null;
  price: string;
  priceNaira: number;
  status: string;
  color: "success" | "error";
};

type ApiService = {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
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
    categoryId: service.category.id,
    category: service.category.name,
    description: service.description ?? "",
    photoUrl: service.photoUrl,
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
  const [pageView, setPageView] = useState<PageView>("catalog");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [name, setName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePhotoUrl, setServicePhotoUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isCategoryCreating, setIsCategoryCreating] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [priceNaira, setPriceNaira] = useState("25000");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryFormDescription, setCategoryFormDescription] = useState("");
  const [categoryFormImageUrl, setCategoryFormImageUrl] = useState("");
  const sortedCategories = [...categories].sort((left, right) => left.name.localeCompare(right.name));
  const activeServices = services.filter((service) => service.status === "Active");
  const activeServiceCount = activeServices.length;
  const visibleServices = services.filter((service) => {
    const categoryMatches = !selectedCategoryId || service.categoryId === selectedCategoryId;
    const searchMatches = `${service.name} ${service.description}`.toLowerCase().includes(serviceSearch.trim().toLowerCase());
    return categoryMatches && searchMatches;
  });
  const servicesWithDuration = activeServices.filter((service) => service.durationMinutes !== null);
  const averageDuration = servicesWithDuration.length
    ? Math.round(servicesWithDuration.reduce((total, service) => total + (service.durationMinutes ?? 0), 0) / servicesWithDuration.length)
    : 0;
  const averagePrice = activeServices.length
    ? Math.round(activeServices.reduce((total, service) => total + service.priceNaira, 0) / activeServices.length)
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
    setSelectedCategoryId((currentId) =>
      currentId && nextCategories.some((category) => category.id === currentId)
        ? currentId
        : [...nextCategories].sort((left, right) => left.name.localeCompare(right.name))[0]?.id ?? "",
    );
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
    setServiceDescription("");
    setServicePhotoUrl("");
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
        body: JSON.stringify({ name, categoryId, description: serviceDescription, photoUrl: servicePhotoUrl, durationMinutes: Number(durationMinutes), priceNaira: Number(priceNaira) }),
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
          description: serviceDescription,
          photoUrl: servicePhotoUrl,
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

  function openCategoryForm(category?: ServiceCategory) {
    setCategoryFormError("");
    setEditingCategoryId(category?.id ?? null);
    setCategoryFormName(category?.name ?? "");
    setCategoryFormDescription(category?.description ?? "");
    setCategoryFormImageUrl(category?.imageUrl ?? "");
    setIsCategoryFormOpen(true);
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryFormError("");
    setIsCategorySaving(true);

    try {
      const token = getAccessToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");

      const response = await fetch(
        `${API_BASE_URL}/api/services/categories${editingCategoryId ? `/${editingCategoryId}` : ""}`,
        {
          method: editingCategoryId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: categoryFormName.trim(),
            description: categoryFormDescription.trim(),
            imageUrl: categoryFormImageUrl.trim(),
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to save category.");
      }

      await refreshCategories();
      setIsCategoryFormOpen(false);
    } catch (error) {
      setCategoryFormError(error instanceof Error ? error.message : "Unable to save category.");
    } finally {
      setIsCategorySaving(false);
    }
  }

  async function handleDeleteCategory(category: ServiceCategory) {
    if (!window.confirm(`Delete ${category.name}?`)) return;

    const token = getAccessToken();
    if (!token) {
      setPageError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/services/categories/${category.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to delete category.");
      }
      await refreshCategories();
      await refreshServices();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete category.");
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Services" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active treatments</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{activeServiceCount}</p>
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

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {(["catalog", "categories"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setPageView(view)}
            className={`rounded-t-lg px-4 py-3 text-sm font-medium transition-colors ${pageView === view ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"}`}
          >
            {view === "catalog" ? "Service Catalog" : "Service Category"}
          </button>
        ))}
      </div>

      <ComponentCard
        title={pageView === "catalog" ? "Service catalog" : "Service categories"}
        desc={pageView === "catalog" ? "Current offerings, pricing, and treatment availability." : "Manage category photos, descriptions, and catalog groupings."}
      >
        {pageError && <p role="alert" className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{pageError}</p>}
        {pageView === "categories" ? (
          <>
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={() => openCategoryForm()}>Add Category</Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-[680px] w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {sortedCategories.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">No service categories found.</td></tr>
                  ) : sortedCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        {category.imageUrl ? <Image src={category.imageUrl} alt={`${category.name} category`} width={56} height={56} unoptimized className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">No photo</div>}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{category.name}</td>
                      <td className="max-w-lg px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{category.description || "No description"}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-3">
                          <button type="button" onClick={() => openCategoryForm(category)} className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Edit</button>
                          <button type="button" onClick={() => handleDeleteCategory(category)} className="text-error-500 hover:text-error-600 dark:text-error-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 overflow-x-auto">
              <div className="flex w-max min-w-full gap-2 pb-2">
                {sortedCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategoryId === category.id ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="search"
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                placeholder="Search services"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:w-72"
              />
              <Button size="sm" onClick={() => { setCreateError(""); setCategoryId(selectedCategoryId); setIsCreateOpen(true); }}>Add Service</Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-[820px] w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {isLoadingServices ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">Loading services...</td></tr>
                  ) : visibleServices.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">{pageError ? "Services could not be loaded." : "No services found in this category."}</td></tr>
                  ) : visibleServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex min-w-[300px] items-center gap-3">
                          {service.photoUrl ? <Image src={service.photoUrl} alt={service.name} width={56} height={56} unoptimized className="h-14 w-14 shrink-0 rounded-lg object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">No photo</div>}
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{service.name}</p>
                            <p className="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">{service.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.duration}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.price}</td>
                      <td className="px-4 py-4 text-sm"><Badge variant="light" color={service.color}>{service.status}</Badge></td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(service.id);
                              setName(service.name);
                              setServiceDescription(service.description);
                              setServicePhotoUrl(service.photoUrl ?? "");
                              setCategoryId(service.categoryId);
                              setDurationMinutes(service.durationMinutes === null ? "" : String(service.durationMinutes));
                              setPriceNaira(String(service.priceNaira));
                              setIsEditOpen(true);
                            }}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >Edit</button>
                          <button type="button" onClick={() => handleDeleteService(service.id, service.name)} className="text-error-500 hover:text-error-600 dark:text-error-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ComponentCard>

      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true">
          <form onSubmit={isEditOpen ? updateService : createService} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{isEditOpen ? "Edit service" : "Add service"}</h2>
            {createError && <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{createError}</p>}
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Service name" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            <select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            <textarea value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value)} placeholder="Service description (optional)" rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            <input type="url" value={servicePhotoUrl} onChange={(event) => setServicePhotoUrl(event.target.value)} placeholder="Service photo URL (optional)" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />

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

      {isCategoryFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4" role="dialog" aria-modal="true">
          <form onSubmit={saveCategory} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{editingCategoryId ? "Edit category" : "Add category"}</h2>
            {categoryFormError && <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{categoryFormError}</p>}
            <input required minLength={2} value={categoryFormName} onChange={(event) => setCategoryFormName(event.target.value)} placeholder="Category name" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            <textarea value={categoryFormDescription} onChange={(event) => setCategoryFormDescription(event.target.value)} placeholder="Category description (optional)" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            <input type="url" value={categoryFormImageUrl} onChange={(event) => setCategoryFormImageUrl(event.target.value)} placeholder="Category photo URL (optional)" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsCategoryFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button>
              <Button size="sm" type="submit" disabled={isCategorySaving}>{isCategorySaving ? "Saving..." : editingCategoryId ? "Save changes" : "Add category"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
