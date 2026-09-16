import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Spaelaris service catalog",
  description: "Manage spa treatments, durations, pricing, and availability",
};

const services = [
  {
    name: "Deep Tissue Massage",
    category: "Massage therapy",
    duration: "60 min",
    price: "₦32,000",
    status: "Active",
    color: "success",
  },
  {
    name: "Glow Facial",
    category: "Facials",
    duration: "45 min",
    price: "₦24,500",
    status: "Active",
    color: "primary",
  },
  {
    name: "Aromatherapy Session",
    category: "Wellness",
    duration: "50 min",
    price: "₦28,000",
    status: "Active",
    color: "success",
  },
  {
    name: "Couples Retreat",
    category: "Packages",
    duration: "90 min",
    price: "₦58,000",
    status: "Booked out",
    color: "warning",
  },
  {
    name: "Detox Body Scrub",
    category: "Body ritual",
    duration: "55 min",
    price: "₦30,000",
    status: "Active",
    color: "success",
  },
  {
    name: "Luxury Manicure",
    category: "Beauty",
    duration: "30 min",
    price: "₦18,000",
    status: "Paused",
    color: "error",
  },
];

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Services" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active treatments</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">42</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. duration</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">54 min</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Revenue per slot</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">₦28,700</p>
        </div>
      </div>

      <ComponentCard
        title="Service catalog"
        desc="Current offerings, pricing, and treatment availability."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search services"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 sm:w-72"
            />
          </div>
          <Button size="sm">Add service</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
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
              {services.map((service) => (
                <tr key={service.name} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{service.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.duration}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{service.price}</td>
                  <td className="px-4 py-4 text-sm">
                    <Badge variant="light" color={service.color as any}>{service.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    </div>
  );
}
