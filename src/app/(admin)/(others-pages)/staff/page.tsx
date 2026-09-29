"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import React from "react";
import { useEffect, useState } from "react";

type StaffRole = "MANAGER" | "THERAPIST" | "RECEPTIONIST" | "ESTHETICIAN" | "TECHNICIAN" | "CORE" | "SUB_CORE";

type StaffMember = {
  id: string;
  bio: string | null;
  isBookable: boolean;
  displayTitle?: string | null;
  photoUrl?: string | null;
  availability: AvailabilityPeriod[];
  designation?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: StaffRole | string;
    status?: string;
    phone?: string | null;
  };
  location: {
    name: string;
    city: string;
  };
  services: {
    service: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

type ServiceOption = { id: string; name: string; slug: string; category: { id: string; name: string; slug: string } };
type ServiceCategoryOption = { id: string; name: string; slug: string };

type AvailabilityPeriod = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const countryCallingCodes = ["+234", "+1", "+44", "+27", "+254", "+233", "+971"];
const coreRoles = ["Human Resource", "Physiotherapist", "Accountant", "Sales", "Marketer", "Customer Service Rep", "Operations"];
const subCoreRoles = ["Cleaner", "Security", "Maintenance", "Spa-Attendant"];
const maxProfilePhotoLength = 68_000;

function getStaffInitials(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
}

async function prepareProfilePhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile pictures must be 5 MB or smaller.");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read this image."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read this image."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const loadedImage = new Image();
    loadedImage.onload = () => resolve(loadedImage);
    loadedImage.onerror = () => reject(new Error("This image could not be opened."));
    loadedImage.src = source;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable in this browser.");
  const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
  context.drawImage(image, (image.naturalWidth - cropSize) / 2, (image.naturalHeight - cropSize) / 2, cropSize, cropSize, 0, 0, 256, 256);

  let photoUrl = canvas.toDataURL("image/jpeg", 0.72);
  if (photoUrl.length > maxProfilePhotoLength) photoUrl = canvas.toDataURL("image/jpeg", 0.5);
  if (photoUrl.length > maxProfilePhotoLength) throw new Error("This picture could not be compressed enough. Choose a smaller image.");
  return photoUrl;
}

function StaffAvatar({ firstName, lastName, photoUrl, size = "h-10 w-10" }: { firstName: string; lastName: string; photoUrl?: string | null; size?: string }) {
  return (
    <span
      role="img"
      aria-label={`${firstName} ${lastName} profile picture`}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eadcc8] font-semibold text-[#5b4732] ${size}`}
      style={photoUrl ? { backgroundImage: `url("${photoUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
    >
      {!photoUrl && getStaffInitials(firstName, lastName)}
    </span>
  );
}

function ProfilePhotoField({ firstName, lastName, photoUrl, onFileSelected }: { firstName: string; lastName: string; photoUrl: string; onFileSelected: (file: File) => void }) {
  return (
    <div className="flex items-center gap-4">
      <StaffAvatar firstName={firstName || "First"} lastName={lastName || "Last"} photoUrl={photoUrl} size="h-14 w-14 text-lg" />
      <label className="cursor-pointer text-sm font-medium text-brand-500 hover:text-brand-600">
        <span>{photoUrl ? "Change profile picture" : "Add profile picture"}</span>
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = "";
        }} />
        <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">JPG, PNG, or WebP, up to 5 MB</span>
      </label>
    </div>
  );
}

function PhoneNumberInput({
  countryCode,
  digits,
  onCountryCodeChange,
  onDigitsChange,
}: {
  countryCode: string;
  digits: string;
  onCountryCodeChange: (value: string) => void;
  onDigitsChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>Phone <span className="text-gray-400">(optional)</span></Label>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <select aria-label="Country calling code" value={countryCode} onChange={(event) => onCountryCodeChange(event.target.value)} className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
          {countryCallingCodes.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
        <input value={digits} onChange={(event) => onDigitsChange(event.target.value.replace(/\D/g, ""))} placeholder="Phone digits" type="text" inputMode="numeric" autoComplete="tel-national" className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
      </div>
    </div>
  );
}

function splitPhoneNumber(phone: string | null | undefined) {
  if (!phone) return { countryCode: "+234", digits: "" };
  const normalizedPhone = phone.trim();
  const countryCode = countryCallingCodes.find((code) => normalizedPhone.startsWith(code)) ?? "+234";
  const localNumber = countryCode === "+234" && !normalizedPhone.startsWith(countryCode)
    ? normalizedPhone
    : normalizedPhone.slice(countryCode.length);
  return { countryCode, digits: localNumber.replace(/\D/g, "") };
}

function getStatusClasses(status: string) {
  if (status === "Bookable") {
    return "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";
  }

  if (status === "In session") {
    return "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500";
  }

  return "bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300";
}

function formatAvailability(periods: AvailabilityPeriod[]) {
  return weekdays.flatMap((day, dayOfWeek) => {
    const dayPeriods = periods
      .filter((period) => period.dayOfWeek === dayOfWeek)
      .sort((first, second) => first.startTime.localeCompare(second.startTime));
    if (dayPeriods.length === 0) return [];
    return [`${day.slice(0, 3)} ${dayPeriods.map(({ startTime, endTime }) => `${startTime}-${endTime}`).join(", ")}`];
  });
}

export default function StaffDirectoryPage() {
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+234");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [createPhotoUrl, setCreatePhotoUrl] = useState("");
  const [locationSlug, setLocationSlug] = useState("lagos");
  const [serviceSlugs, setServiceSlugs] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategoryOption[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceLoadError, setServiceLoadError] = useState("");
  const [editingServices, setEditingServices] = useState<StaffMember | null>(null);
  const [serviceAssignmentDraft, setServiceAssignmentDraft] = useState<string[]>([]);
  const [assignmentCategorySlug, setAssignmentCategorySlug] = useState("");
  const [createCategorySlug, setCreateCategorySlug] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [serviceAssignmentError, setServiceAssignmentError] = useState("");
  const [isSavingServices, setIsSavingServices] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<StaffMember | null>(null);
  const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilityPeriod[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [activeTab, setActiveTab] = useState<StaffRole>("THERAPIST");
  const [isRoleCreateOpen, setIsRoleCreateOpen] = useState(false);
  const [roleCreateType, setRoleCreateType] = useState<StaffRole>("MANAGER");
  const [roleCreateError, setRoleCreateError] = useState("");
  const [roleActionError, setRoleActionError] = useState("");
  const [roleForm, setRoleForm] = useState({ firstName: "", lastName: "", email: "", locationSlug: "lagos", designation: "", password: "" });
  const [rolePhoneCountryCode, setRolePhoneCountryCode] = useState("+234");
  const [rolePhoneDigits, setRolePhoneDigits] = useState("");
  const [rolePhotoUrl, setRolePhotoUrl] = useState("");
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [isSavingRoleMember, setIsSavingRoleMember] = useState(false);
  const [removingRoleMemberId, setRemovingRoleMemberId] = useState<string | null>(null);
  const [editingRoleMember, setEditingRoleMember] = useState<StaffMember | null>(null);
  const [editingPhotoStaff, setEditingPhotoStaff] = useState<StaffMember | null>(null);
  const [photoDraft, setPhotoDraft] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      const token = getAccessToken();

      if (!token) {
        setError("Your session has expired. Please sign in again.");
        setIsLoading(false);
        setIsLoadingServices(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [response, serviceResponse, categoryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/staff`, { headers }),
          fetch(`${API_BASE_URL}/api/services`, { headers }),
          fetch(`${API_BASE_URL}/api/services/categories`, { headers }),
        ]);
        if (!response.ok) throw new Error("Unable to load staff records.");
        if (!serviceResponse.ok) throw new Error("Unable to load service options.");
        if (!categoryResponse.ok) throw new Error("Unable to load service categories.");
        const nextStaff = (await response.json()) as StaffMember[];
        const nextServices = (await serviceResponse.json()) as ServiceOption[];
        const nextCategories = (await categoryResponse.json()) as ServiceCategoryOption[];
        const normalizedStaff = nextStaff.map((staff) => ({
          ...staff,
          designation: staff.designation ?? staff.displayTitle ?? (staff.user.role === "MANAGER" ? "Operations Manager" : staff.user.role === "RECEPTIONIST" ? "Front Desk Lead" : "Therapist"),
        }));
        setStaffData(normalizedStaff);
        setServiceOptions(nextServices);
        setServiceCategories(nextCategories);
        if (!createCategorySlug && nextCategories[0]?.slug) {
          setCreateCategorySlug(nextCategories[0].slug);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load staff records.");
      } finally {
        setIsLoading(false);
        setIsLoadingServices(false);
      }
    }

    void loadStaff();
  }, []);

  async function createServiceCategory(targetSlugSetter: (slug: string) => void, name: string, errorSetter: (message: string) => void) {
    const trimmed = name.trim();
    if (!trimmed) {
      errorSetter("Category name is required.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      errorSetter("Your session has expired. Please sign in again.");
      return;
    }

    setIsCreatingCategory(true);
    errorSetter("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/services/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: trimmed }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create category.");
      }

      const nextCategory = payload as ServiceCategoryOption;
      setServiceCategories((current) => {
        const exists = current.some((category) => category.id === nextCategory.id);
        return exists ? current : [...current, nextCategory];
      });
      targetSlugSetter(nextCategory.slug);
      setNewCategoryName("");
    } catch (categoryError) {
      errorSetter(categoryError instanceof Error ? categoryError.message : "Unable to create category.");
    } finally {
      setIsCreatingCategory(false);
    }
  }

  function toggleService(serviceSlug: string) {
    setServiceSlugs((current) => {
      if (current.includes(serviceSlug)) return current.filter((value) => value !== serviceSlug);
      if (current.length >= 4) {
        setCreateError("Choose no more than four services for a therapist.");
        return current;
      }
      setCreateError("");
      return [...current, serviceSlug];
    });
  }

  function openServiceEditor(staff: StaffMember) {
    setEditingServices(staff);
    setServiceAssignmentDraft(staff.services.map(({ service }) => service.slug));
    const firstAssignedCategory = serviceOptions.find((service) => staff.services.some(({ service: assigned }) => assigned.slug === service.slug))?.category.slug;
    setAssignmentCategorySlug(firstAssignedCategory ?? serviceCategories[0]?.slug ?? "");
    setServiceAssignmentError("");
  }

  function toggleAssignedService(serviceSlug: string) {
    setServiceAssignmentDraft((current) => {
      if (current.includes(serviceSlug)) return current.filter((slug) => slug !== serviceSlug);
      if (current.length >= 4) {
        setServiceAssignmentError("Choose no more than four services for a therapist.");
        return current;
      }
      setServiceAssignmentError("");
      return [...current, serviceSlug];
    });
  }

  async function saveServiceAssignments(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingServices) return;
    const token = getAccessToken();
    if (!token) {
      setServiceAssignmentError("Your session has expired. Please sign in again.");
      return;
    }
    setServiceAssignmentError("");
    setIsSavingServices(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/${editingServices.id}/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceSlugs: serviceAssignmentDraft }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to update therapist services.");
      }
      const assigned = payload as { service: { id: string; name: string; slug: string } }[];
      setStaffData((current) => current.map((staff) => staff.id === editingServices.id
        ? { ...staff, services: assigned }
        : staff,
      ));
      setEditingServices(null);
    } catch (saveError) {
      setServiceAssignmentError(saveError instanceof Error ? saveError.message : "Unable to update therapist services.");
    } finally {
      setIsSavingServices(false);
    }
  }

  function openAvailabilityEditor(staff: StaffMember) {
    setEditingAvailability(staff);
    setServiceAssignmentDraft(staff.services.map(({ service }) => service.slug));
    const firstAssignedCategory = serviceOptions.find((service) => staff.services.some(({ service: assigned }) => assigned.slug === service.slug))?.category.slug;
    setAssignmentCategorySlug(firstAssignedCategory ?? serviceCategories[0]?.slug ?? "");
    setAvailabilityDraft(staff.availability.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })));
    setAvailabilityError("");
  }

  function updateAvailabilityPeriod(index: number, field: keyof AvailabilityPeriod, value: string | number) {
    setAvailabilityDraft((current) => current.map((period, periodIndex) =>
      periodIndex === index ? { ...period, [field]: value } : period,
    ));
  }

  async function saveAvailability(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAvailability) return;
    setAvailabilityError("");
    setIsSavingAvailability(true);
    const token = getAccessToken();
    if (!token) {
      setAvailabilityError("Your session has expired. Please sign in again.");
      setIsSavingAvailability(false);
      return;
    }

    try {
      if (serviceAssignmentDraft.length > 4) {
        throw new Error("Choose no more than four services for a therapist.");
      }

      const serviceResponse = await fetch(`${API_BASE_URL}/api/staff/${editingAvailability.id}/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceSlugs: serviceAssignmentDraft }),
      });
      const servicePayload = await serviceResponse.json();
      if (!serviceResponse.ok) {
        throw new Error(Array.isArray(servicePayload?.message) ? servicePayload.message.join(", ") : servicePayload?.message || "Unable to update therapist services.");
      }

      const response = await fetch(`${API_BASE_URL}/api/staff/${editingAvailability.id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability: availabilityDraft }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to save therapist availability.");
      }

      setStaffData((current) => current.map((staff) => staff.id === editingAvailability.id
        ? { ...staff, availability: payload as AvailabilityPeriod[], services: (servicePayload as { service: { id: string; name: string; slug: string } }[]) }
        : staff,
      ));
      setEditingAvailability(null);
    } catch (saveError) {
      setAvailabilityError(saveError instanceof Error ? saveError.message : "Unable to save therapist availability.");
    } finally {
      setIsSavingAvailability(false);
    }
  }

  async function handleCreateStaff(event: React.FormEvent<HTMLFormElement>) {
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
      const response = await fetch(`${API_BASE_URL}/api/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, email, phone: phoneDigits ? `${phoneCountryCode}${phoneDigits}` : undefined, photoUrl: createPhotoUrl || undefined, locationSlug, serviceSlugs }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create staff member.");
      }

      const refreshResponse = await fetch(`${API_BASE_URL}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!refreshResponse.ok) throw new Error("Staff member was created, but the directory could not refresh.");

      setStaffData((await refreshResponse.json()) as StaffMember[]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhoneDigits("");
      setPhoneCountryCode("+234");
      setCreatePhotoUrl("");
      setLocationSlug("lagos");
      setServiceSlugs([]);
      setCreateCategorySlug(serviceCategories[0]?.slug ?? "");
      setIsCreateOpen(false);
    } catch (submitError) {
      setCreateError(submitError instanceof Error ? submitError.message : "Unable to create staff member.");
    } finally {
      setIsCreating(false);
    }
  }

  function openCreateRoleMember(role: StaffRole) {
    setRoleCreateType(role);
    setRoleCreateError("");
    const placeholderByRole: Record<StaffRole, string> = {
      MANAGER: "Operations Manager",
      THERAPIST: "Therapist",
      RECEPTIONIST: "Front Desk Lead",
      ESTHETICIAN: "Esthetician",
      TECHNICIAN: "Technician",
      CORE: coreRoles[0],
      SUB_CORE: subCoreRoles[3],
    };
    setRoleForm({ firstName: "", lastName: "", email: "", locationSlug: "lagos", designation: placeholderByRole[role], password: "" });
    setRolePhoneCountryCode("+234");
    setRolePhoneDigits("");
    setRolePhotoUrl("");
    setShowInitialPassword(false);
    setIsRoleCreateOpen(true);
  }

  function openEditRoleMember(staff: StaffMember) {
    const normalizedRole = getDisplayRoleGroup(staff);
    const parsedPhone = splitPhoneNumber(staff.user.phone);
    setEditingRoleMember(staff);
    setRoleCreateType(normalizedRole);
    setRoleForm({
      firstName: staff.user.firstName,
      lastName: staff.user.lastName,
      email: staff.user.email,
      locationSlug: staff.location.name.toLowerCase().includes("abuja") ? "abuja" : "lagos",
      designation: staff.designation ?? staff.displayTitle ?? (normalizedRole === "MANAGER" ? "Operations Manager" : normalizedRole === "CORE" ? coreRoles[0] : normalizedRole === "SUB_CORE" ? subCoreRoles[0] : normalizedRole === "ESTHETICIAN" ? "Esthetician" : normalizedRole === "TECHNICIAN" ? "Technician" : "Front Desk Lead"),
      password: "",
    });
    setRolePhoneCountryCode(parsedPhone.countryCode);
    setRolePhoneDigits(parsedPhone.digits);
  }

  async function saveRoleMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roleCreateType) return;
    const token = getAccessToken();
    if (!token) {
      setRoleCreateError("Your session has expired. Please sign in again.");
      return;
    }

    setIsSavingRoleMember(true);
    setRoleCreateError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: roleForm.firstName,
          lastName: roleForm.lastName,
          email: roleForm.email,
          phone: rolePhoneDigits ? `${rolePhoneCountryCode}${rolePhoneDigits}` : undefined,
          locationSlug: roleForm.locationSlug,
          serviceSlugs: [],
          role: getBackendRoleForTab(roleCreateType),
          displayTitle: roleForm.designation,
          photoUrl: rolePhotoUrl || undefined,
          initialPassword: roleCreateType === "SUB_CORE" ? undefined : roleForm.password || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to create staff record.");
      }

      const refreshResponse = await fetch(`${API_BASE_URL}/api/staff`, { headers: { Authorization: `Bearer ${token}` } });
      if (!refreshResponse.ok) throw new Error("Staff updated but the directory could not refresh.");

      const nextStaff = (await refreshResponse.json()) as StaffMember[];
      setStaffData(nextStaff.map((staff) => ({
        ...staff,
        designation: staff.designation ?? staff.displayTitle ?? (staff.user.role === "MANAGER" ? "Operations Manager" : staff.user.role === "RECEPTIONIST" ? "Front Desk Lead" : "Therapist"),
      })));
      setIsRoleCreateOpen(false);
      setRoleForm({ firstName: "", lastName: "", email: "", locationSlug: "lagos", designation: roleCreateType === "MANAGER" ? "Operations Manager" : roleCreateType === "ESTHETICIAN" ? "Esthetician" : roleCreateType === "TECHNICIAN" ? "Technician" : roleCreateType === "CORE" ? coreRoles[0] : roleCreateType === "SUB_CORE" ? subCoreRoles[0] : "Front Desk Lead", password: "" });
      setRolePhoneDigits("");
      setRolePhotoUrl("");
      setRoleCreateType("MANAGER");
    } catch (submitError) {
      setRoleCreateError(submitError instanceof Error ? submitError.message : "Unable to create staff record.");
    } finally {
      setIsSavingRoleMember(false);
    }
  }

  async function saveEditedRoleMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRoleMember) return;
    const token = getAccessToken();
    if (!token) {
      setRoleCreateError("Your session has expired. Please sign in again.");
      return;
    }

    setIsSavingRoleMember(true);
    setRoleCreateError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/${editingRoleMember.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: roleForm.firstName,
          lastName: roleForm.lastName,
          email: roleForm.email,
          phone: rolePhoneDigits ? `${rolePhoneCountryCode}${rolePhoneDigits}` : null,
          locationSlug: roleForm.locationSlug,
          role: getBackendRoleForTab(roleCreateType),
          displayTitle: roleForm.designation,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to update staff member.");

      const refreshResponse = await fetch(`${API_BASE_URL}/api/staff`, { headers: { Authorization: `Bearer ${token}` } });
      if (!refreshResponse.ok) throw new Error("Staff member was updated, but the directory could not refresh.");
      const nextStaff = (await refreshResponse.json()) as StaffMember[];
      setStaffData(nextStaff.map((staff) => ({
        ...staff,
        designation: staff.designation ?? staff.displayTitle ?? (staff.user.role === "MANAGER" ? "Operations Manager" : staff.user.role === "RECEPTIONIST" ? "Front Desk Lead" : "Therapist"),
      })));
      setEditingRoleMember(null);
      setRolePhoneDigits("");
    } catch (saveError) {
      setRoleCreateError(saveError instanceof Error ? saveError.message : "Unable to update staff member.");
    } finally {
      setIsSavingRoleMember(false);
    }
  }

  async function removeRoleMember(staffId: string) {
    const token = getAccessToken();
    if (!token) {
      setRoleActionError("Your session has expired. Please sign in again.");
      return;
    }

    setRemovingRoleMemberId(staffId);
    setRoleActionError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/${staffId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to remove staff member.");
      setStaffData((current) => current.filter((staff) => staff.id !== staffId));
      if (editingRoleMember?.id === staffId) setEditingRoleMember(null);
    } catch (removeError) {
      setRoleActionError(removeError instanceof Error ? removeError.message : "Unable to remove staff member.");
    } finally {
      setRemovingRoleMemberId(null);
    }
  }

  function openPhotoEditor(staff: StaffMember) {
    setEditingPhotoStaff(staff);
    setPhotoDraft(staff.photoUrl ?? "");
    setPhotoError("");
  }

  async function saveStaffPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPhotoStaff || !photoDraft) return;
    const token = getAccessToken();
    if (!token) {
      setPhotoError("Your session has expired. Please sign in again.");
      return;
    }

    setIsSavingPhoto(true);
    setPhotoError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/${editingPhotoStaff.id}/photo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ photoUrl: photoDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Unable to update profile picture.");
      setStaffData((current) => current.map((staff) => staff.id === editingPhotoStaff.id ? { ...staff, photoUrl: payload.photoUrl } : staff));
      setEditingPhotoStaff(null);
    } catch (saveError) {
      setPhotoError(saveError instanceof Error ? saveError.message : "Unable to update profile picture.");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  function getDisplayRoleGroup(staff: StaffMember): StaffRole {
    const normalizedRole = (staff.user.role || "THERAPIST").toUpperCase();
    if (normalizedRole === "MANAGER") return "MANAGER";
    const designation = (staff.designation || staff.displayTitle || "").toLowerCase();
    if (/(esthetic|beautician|facial|skincare)/.test(designation)) return "ESTHETICIAN";
    if (/(technician|tech|equipment|repair)/.test(designation)) return "TECHNICIAN";
    if (/(human resource|\bhr\b|physiotherap|accountant|sales|market|customer service|operations)/.test(designation)) return "CORE";
    if (/(cleaner|security|maintenance|spa-attendant|attendant)/.test(designation)) return "SUB_CORE";
    if (normalizedRole === "RECEPTIONIST") return "RECEPTIONIST";
    if (normalizedRole === "THERAPIST") return "THERAPIST";
    return "THERAPIST";
  }

  function getBackendRoleForTab(tab: StaffRole): "MANAGER" | "THERAPIST" | "RECEPTIONIST" {
    switch (tab) {
      case "MANAGER":
        return "MANAGER";
      case "ESTHETICIAN":
      case "TECHNICIAN":
      case "THERAPIST":
        return "THERAPIST";
      case "CORE":
      case "SUB_CORE":
      case "RECEPTIONIST":
        return "RECEPTIONIST";
      default:
        return "THERAPIST";
    }
  }

  const therapists = staffData.filter((staff) => getDisplayRoleGroup(staff) === "THERAPIST");
  const managers = staffData.filter((staff) => getDisplayRoleGroup(staff) === "MANAGER");
  const receptionists = staffData.filter((staff) => getDisplayRoleGroup(staff) === "RECEPTIONIST");
  const estheticians = staffData.filter((staff) => getDisplayRoleGroup(staff) === "ESTHETICIAN");
  const technicians = staffData.filter((staff) => getDisplayRoleGroup(staff) === "TECHNICIAN");
  const coreStaff = staffData.filter((staff) => getDisplayRoleGroup(staff) === "CORE");
  const subCoreStaff = staffData.filter((staff) => getDisplayRoleGroup(staff) === "SUB_CORE");
  const bookableCount = therapists.filter((staff) => staff.isBookable).length;
  const unscheduledCount = therapists.filter((staff) => staff.availability.length === 0).length;
  const createCategoryServices = serviceOptions.filter((service) => service.category.slug === createCategorySlug);
  const assignmentCategoryServices = serviceOptions.filter((service) => service.category.slug === assignmentCategorySlug);
  const tabOptions: { key: StaffRole; label: string }[] = [
    { key: "MANAGER", label: "Managers" },
    { key: "THERAPIST", label: "Therapists" },
    { key: "RECEPTIONIST", label: "Receptionists" },
    { key: "ESTHETICIAN", label: "Estheticians" },
    { key: "TECHNICIAN", label: "Technicians" },
    { key: "CORE", label: "Core" },
    { key: "SUB_CORE", label: "Sub-Core" },
  ];
  const visibleStaff = activeTab === "MANAGER"
    ? managers
    : activeTab === "RECEPTIONIST"
      ? receptionists
      : activeTab === "ESTHETICIAN"
        ? estheticians
        : activeTab === "TECHNICIAN"
          ? technicians
          : activeTab === "CORE"
            ? coreStaff
            : activeTab === "SUB_CORE"
              ? subCoreStaff
              : therapists;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Staff & Therapists" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active staff</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{staffData.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Bookable today</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{bookableCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Therapists without hours</p>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{unscheduledCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Team directory</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Split by role so each team view is easy to manage.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (activeTab === "THERAPIST") {
                  setCreateError("");
                  setCreateCategorySlug(serviceCategories[0]?.slug ?? "");
                  setServiceSlugs([]);
                  setIsCreateOpen(true);
                  return;
                }
                openCreateRoleMember(activeTab);
              }}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              {activeTab === "THERAPIST" ? "Add therapist" : `Add ${activeTab.toLowerCase()}`}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              {tabOptions.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.key ? "bg-brand-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.08]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="px-5 py-4 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {roleActionError && <p role="alert" className="px-5 py-4 text-sm text-error-600 dark:text-error-400">{roleActionError}</p>}
        {isLoading && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Loading staff records...</p>}
        {!isLoading && !error && staffData.length === 0 && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No active staff records found.</p>}

        {!isLoading && !error && visibleStaff.length > 0 && activeTab === "THERAPIST" && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Team member</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Services</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Weekly hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {visibleStaff.map((staff) => {
                  const status = staff.isBookable ? "Bookable" : "Unavailable";
                  return (
                    <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => openPhotoEditor(staff)} title={`Update ${staff.user.firstName}'s profile picture`} className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                            <StaffAvatar firstName={staff.user.firstName} lastName={staff.user.lastName} photoUrl={staff.photoUrl} />
                          </button>
                          <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">{staff.user.firstName} {staff.user.lastName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{staff.user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{staff.location.name}<br />{staff.location.city}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex min-w-56 items-start justify-between gap-3">
                          <span>{staff.services.map(({ service }) => service.name).join(", ") || "Not assigned"}</span>
                          <button type="button" onClick={() => openServiceEditor(staff)} className="shrink-0 font-medium text-brand-500 hover:text-brand-600">Edit</button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{staff.user.email}</td>
                      <td className="px-5 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex min-w-44 items-start justify-between gap-3">
                          {staff.availability.length > 0
                            ? <span className="space-y-1 text-xs text-gray-600 dark:text-gray-300">{formatAvailability(staff.availability).map((period) => <span key={period} className="block">{period}</span>)}</span>
                            : <span className="text-xs text-warning-600 dark:text-warning-500">No hours set</span>}
                          <button type="button" onClick={() => openAvailabilityEditor(staff)} className="shrink-0 font-medium text-brand-500 hover:text-brand-600">Edit</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && visibleStaff.length > 0 && activeTab !== "THERAPIST" && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Name & designation</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Branch location</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact detail</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {visibleStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => openPhotoEditor(staff)} title={`Update ${staff.user.firstName}'s profile picture`} className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                          <StaffAvatar firstName={staff.user.firstName} lastName={staff.user.lastName} photoUrl={staff.photoUrl} />
                        </button>
                        <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">{staff.user.firstName} {staff.user.lastName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{staff.designation ?? (staff.user.role === "MANAGER" ? "Operations Manager" : "Front Desk Lead")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{staff.location.name}<br />{staff.location.city}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div>{staff.user.email}</div>
                      {staff.user.phone && <div className="mt-1 text-gray-500 dark:text-gray-400">{staff.user.phone}</div>}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(staff.user.status === "ACTIVE" ? "Bookable" : "Unavailable")}`}>
                        {staff.user.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex gap-3">
                        <button type="button" onClick={() => openEditRoleMember(staff)} className="font-medium text-brand-500 hover:text-brand-600">Edit</button>
                        <button type="button" onClick={() => void removeRoleMember(staff.id)} disabled={removingRoleMemberId === staff.id} className="font-medium text-error-500 hover:text-error-600 disabled:cursor-wait disabled:opacity-60">{removingRoleMemberId === staff.id ? "Removing..." : "Remove"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && visibleStaff.length === 0 && (
          <div className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">
            No {activeTab.toLowerCase()} records found.
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="create-staff-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div>
                <h2 id="create-staff-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Add staff member</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a therapist profile for bookings.</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            <form onSubmit={handleCreateStaff} className="max-h-[calc(90vh-72px)] space-y-4 overflow-y-auto px-6 py-5">
              {createError && <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{createError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>First name</Label><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nneka" required /></div>
                <div><Label>Last name</Label><Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Adeyemi" required /></div>
              </div>
              <ProfilePhotoField firstName={firstName} lastName={lastName} photoUrl={createPhotoUrl} onFileSelected={(file) => { void prepareProfilePhoto(file).then(setCreatePhotoUrl).catch((photoIssue) => setCreateError(photoIssue instanceof Error ? photoIssue.message : "Unable to process profile picture.")); }} />
              <div><Label>Email</Label><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="therapist@spaelaris.com" type="email" required /></div>
              <PhoneNumberInput countryCode={phoneCountryCode} digits={phoneDigits} onCountryCodeChange={setPhoneCountryCode} onDigitsChange={setPhoneDigits} />
              <div>
                <Label>Location</Label>
                <select value={locationSlug} onChange={(event) => setLocationSlug(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option value="lagos">Spaelaris Lagos</option>
                  <option value="abuja">Spaelaris Abuja</option>
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Service category</Label>
                  <div className="flex gap-2">
                    <select value={createCategorySlug} onChange={(event) => setCreateCategorySlug(event.target.value)} className="h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                      {serviceCategories.length === 0 ? <option value="">No categories available</option> : serviceCategories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => void createServiceCategory(setCreateCategorySlug, newCategoryName, setCreateError)} disabled={!newCategoryName.trim() || isCreatingCategory}>Add</Button>
                  </div>
                </div>
                <div>
                  <Label>New category</Label>
                  <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Massage, Facials, etc." />
                </div>
                <div>
                  <Label>Services in {serviceCategories.find((category) => category.slug === createCategorySlug)?.name ?? "selected category"}</Label>
                  {isLoadingServices ? <p className="text-sm text-gray-500">Loading active services...</p> : serviceLoadError ? <p role="alert" className="text-sm text-error-600">{serviceLoadError}</p> : <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    {createCategoryServices.length === 0 ? <p className="text-sm text-gray-500">No services found for this category yet.</p> : createCategoryServices.map((service) => <label key={service.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <input type="checkbox" checked={serviceSlugs.includes(service.slug)} onChange={() => toggleService(service.slug)} />
                      <span>{service.name}</span>
                    </label>)}
                  </div>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected services: {serviceSlugs.length}/4</p>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button type="button" variant="outline" size="sm" onClick={() => { setIsCreateOpen(false); setServiceSlugs([]); setCreateCategorySlug(serviceCategories[0]?.slug ?? ""); }}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating || serviceSlugs.length === 0 || isLoadingServices || Boolean(serviceLoadError)}>{isCreating ? "Creating..." : "Create staff member"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRoleCreateOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="role-create-title">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div>
                <h2 id="role-create-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">{roleCreateType === "MANAGER" ? "Add manager" : "Add Team Member"}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a {roleCreateType.toLowerCase()} profile for the branch.</p>
              </div>
              <button type="button" onClick={() => setIsRoleCreateOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            <form onSubmit={saveRoleMember} className="max-h-[calc(90vh-72px)] space-y-4 overflow-y-auto px-6 py-5">
              {roleCreateError && <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{roleCreateError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>First name</Label><Input value={roleForm.firstName} onChange={(event) => setRoleForm((current) => ({ ...current, firstName: event.target.value }))} placeholder="Efe" required /></div>
                <div><Label>Last name</Label><Input value={roleForm.lastName} onChange={(event) => setRoleForm((current) => ({ ...current, lastName: event.target.value }))} placeholder="Akin" required /></div>
              </div>
              <ProfilePhotoField firstName={roleForm.firstName} lastName={roleForm.lastName} photoUrl={rolePhotoUrl} onFileSelected={(file) => { void prepareProfilePhoto(file).then(setRolePhotoUrl).catch((photoIssue) => setRoleCreateError(photoIssue instanceof Error ? photoIssue.message : "Unable to process profile picture.")); }} />
              <div><Label>Email</Label><Input value={roleForm.email} onChange={(event) => setRoleForm((current) => ({ ...current, email: event.target.value }))} placeholder="manager@spaelaris.com" type="email" required /></div>
              <PhoneNumberInput countryCode={rolePhoneCountryCode} digits={rolePhoneDigits} onCountryCodeChange={setRolePhoneCountryCode} onDigitsChange={setRolePhoneDigits} />
              <div>
                <Label>Branch location</Label>
                <select value={roleForm.locationSlug} onChange={(event) => setRoleForm((current) => ({ ...current, locationSlug: event.target.value }))} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option value="lagos">Spaelaris Lagos</option>
                  <option value="abuja">Spaelaris Abuja</option>
                </select>
              </div>
              <div>
                <Label>{roleCreateType === "MANAGER" ? "Designation" : "Role"}</Label>
                {roleCreateType === "CORE" || roleCreateType === "SUB_CORE" ? (
                  <select value={roleForm.designation} onChange={(event) => setRoleForm((current) => ({ ...current, designation: event.target.value }))} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    {(roleCreateType === "CORE" ? coreRoles : subCoreRoles).map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                ) : <Input value={roleForm.designation} onChange={(event) => setRoleForm((current) => ({ ...current, designation: event.target.value }))} placeholder={roleCreateType === "MANAGER" ? "Operations Manager" : "Front Desk Lead"} required />}
              </div>
              {roleCreateType !== "SUB_CORE" && <div>
                <Label>Initial password</Label>
                <div className="flex gap-2">
                  <Input value={roleForm.password} onChange={(event) => setRoleForm((current) => ({ ...current, password: event.target.value }))} placeholder="Minimum 8 characters" type={showInitialPassword ? "text" : "password"} required />
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowInitialPassword((visible) => !visible)} aria-label={showInitialPassword ? "Hide password" : "Show password"}>{showInitialPassword ? "Hide" : "Show"}</Button>
                </div>
              </div>}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRoleCreateOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isSavingRoleMember}>{isSavingRoleMember ? "Creating..." : "Create member"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRoleMember && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="role-edit-title">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div>
                <h2 id="role-edit-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit {roleCreateType.toLowerCase()}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update contact and branch details for this staff member.</p>
              </div>
              <button type="button" onClick={() => setEditingRoleMember(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            <form onSubmit={saveEditedRoleMember} className="max-h-[calc(90vh-72px)] space-y-4 overflow-y-auto px-6 py-5">
              {roleCreateError && <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{roleCreateError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>First name</Label><Input value={roleForm.firstName} onChange={(event) => setRoleForm((current) => ({ ...current, firstName: event.target.value }))} required /></div>
                <div><Label>Last name</Label><Input value={roleForm.lastName} onChange={(event) => setRoleForm((current) => ({ ...current, lastName: event.target.value }))} required /></div>
              </div>
              <div><Label>Email</Label><Input value={roleForm.email} onChange={(event) => setRoleForm((current) => ({ ...current, email: event.target.value }))} type="email" required /></div>
              <PhoneNumberInput countryCode={rolePhoneCountryCode} digits={rolePhoneDigits} onCountryCodeChange={setRolePhoneCountryCode} onDigitsChange={setRolePhoneDigits} />
              <div>
                <Label>Branch location</Label>
                <select value={roleForm.locationSlug} onChange={(event) => setRoleForm((current) => ({ ...current, locationSlug: event.target.value }))} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option value="lagos">Spaelaris Lagos</option>
                  <option value="abuja">Spaelaris Abuja</option>
                </select>
              </div>
              <div>
                <Label>Team section</Label>
                <select value={roleCreateType} onChange={(event) => {
                  const nextRole = event.target.value as StaffRole;
                  const defaultDesignations: Record<StaffRole, string> = {
                    MANAGER: "Operations Manager",
                    THERAPIST: "Therapist",
                    RECEPTIONIST: "Front Desk Lead",
                    ESTHETICIAN: "Esthetician",
                    TECHNICIAN: "Technician",
                    CORE: coreRoles[0],
                    SUB_CORE: subCoreRoles[0],
                  };
                  setRoleCreateType(nextRole);
                  setRoleForm((current) => ({ ...current, designation: defaultDesignations[nextRole] }));
                }} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  {tabOptions.map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
                </select>
              </div>
              <div>
                <Label>{roleCreateType === "MANAGER" ? "Designation" : "Role"}</Label>
                {roleCreateType === "CORE" || roleCreateType === "SUB_CORE" ? (
                  <select value={roleForm.designation} onChange={(event) => setRoleForm((current) => ({ ...current, designation: event.target.value }))} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    {(roleCreateType === "CORE" ? coreRoles : subCoreRoles).map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                ) : <Input value={roleForm.designation} onChange={(event) => setRoleForm((current) => ({ ...current, designation: event.target.value }))} required />}
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingRoleMember(null)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isSavingRoleMember}>{isSavingRoleMember ? "Saving..." : "Save changes"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingServices && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="therapist-services-title">
          <form onSubmit={saveServiceAssignments} className="max-h-full w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="therapist-services-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Assigned treatments</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{editingServices.user.firstName} {editingServices.user.lastName} · {editingServices.location.name}</p>
              </div>
              <button type="button" onClick={() => setEditingServices(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Assign every treatment this therapist is qualified to provide. A therapist must be assigned all treatments in a multi-service booking.</p>
            {serviceAssignmentError && <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{serviceAssignmentError}</p>}
            <div className="space-y-3">
              <div>
                <Label>Service category</Label>
                <div className="flex gap-2">
                  <select value={assignmentCategorySlug} onChange={(event) => setAssignmentCategorySlug(event.target.value)} className="h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    {serviceCategories.length === 0 ? <option value="">No categories available</option> : serviceCategories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={() => void createServiceCategory(setAssignmentCategorySlug, newCategoryName, setServiceAssignmentError)} disabled={!newCategoryName.trim() || isCreatingCategory}>Add</Button>
                </div>
              </div>
              <div>
                <Label>New category</Label>
                <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Massage, Facials, etc." />
              </div>
              {isLoadingServices ? <p className="text-sm text-gray-500">Loading active services...</p> : serviceLoadError ? <p role="alert" className="text-sm text-error-600">{serviceLoadError}</p> : <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                {assignmentCategoryServices.length === 0 ? <p className="text-sm text-gray-500">No services found for this category yet.</p> : assignmentCategoryServices.map((service) => <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={serviceAssignmentDraft.includes(service.slug)} onChange={() => toggleAssignedService(service.slug)} />
                  <span>{service.name}</span>
                </label>)}
              </div>}
              <p className="text-xs text-gray-500 dark:text-gray-400">Selected services: {serviceAssignmentDraft.length}/4</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingServices(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isSavingServices || isLoadingServices || Boolean(serviceLoadError)}>{isSavingServices ? "Saving..." : "Save assigned services"}</Button>
            </div>
          </form>
        </div>
      )}

      {editingAvailability && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="availability-title">
          <form onSubmit={saveAvailability} className="max-h-full w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="availability-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Therapist details</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{editingAvailability.user.firstName} {editingAvailability.user.lastName} · {editingAvailability.location.name}</p>
              </div>
              <button type="button" onClick={() => setEditingAvailability(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            {availabilityError && <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{availabilityError}</p>}

            <div className="space-y-4">
              <div>
                <Label>Service category</Label>
                <div className="flex gap-2">
                  <select value={assignmentCategorySlug} onChange={(event) => setAssignmentCategorySlug(event.target.value)} className="h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    {serviceCategories.length === 0 ? <option value="">No categories available</option> : serviceCategories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={() => void createServiceCategory(setAssignmentCategorySlug, newCategoryName, setAvailabilityError)} disabled={!newCategoryName.trim() || isCreatingCategory}>Add</Button>
                </div>
              </div>

              <div>
                <Label>New category</Label>
                <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Massage, Facials, etc." />
              </div>

              <div>
                <Label>Services in {serviceCategories.find((category) => category.slug === assignmentCategorySlug)?.name ?? "selected category"}</Label>
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  {assignmentCategoryServices.length === 0 ? <p className="text-sm text-gray-500">No services found for this category yet.</p> : assignmentCategoryServices.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={serviceAssignmentDraft.includes(service.slug)} onChange={() => toggleAssignedService(service.slug)} />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Selected services: {serviceAssignmentDraft.length}/4</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Weekly availability</h3>
              </div>
              {availabilityDraft.length === 0 && <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">No weekly hours set. Add the days and hours this therapist accepts appointments.</p>}
              <div className="space-y-3">
                {availabilityDraft.map((period, index) => (
                  <div key={`${period.dayOfWeek}-${index}`} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Day<select value={period.dayOfWeek} onChange={(event) => updateAvailabilityPeriod(index, "dayOfWeek", Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">{weekdays.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}</select></label>
                    <label className="text-xs text-gray-500 dark:text-gray-400">From<input type="time" required value={period.startTime} onChange={(event) => updateAvailabilityPeriod(index, "startTime", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></label>
                    <label className="text-xs text-gray-500 dark:text-gray-400">To<input type="time" required value={period.endTime} onChange={(event) => updateAvailabilityPeriod(index, "endTime", event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></label>
                    <button type="button" aria-label={`Remove ${weekdays[period.dayOfWeek]} availability`} onClick={() => setAvailabilityDraft((current) => current.filter((_, periodIndex) => periodIndex !== index))} className="h-10 px-3 text-sm text-error-500 hover:text-error-600">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button type="button" onClick={() => setAvailabilityDraft((current) => [...current, { dayOfWeek: 1, startTime: "", endTime: "" }])} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.04]">Add hours</button>
              <div className="flex gap-3"><Button type="button" variant="outline" size="sm" onClick={() => setEditingAvailability(null)}>Cancel</Button><Button type="submit" size="sm" disabled={isSavingAvailability}>{isSavingAvailability ? "Saving..." : "Save details"}</Button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}