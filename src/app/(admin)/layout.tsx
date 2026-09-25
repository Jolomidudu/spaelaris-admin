"use client";

import { useSidebar } from "@/context/SidebarContext";
import { getStoredAuth, isRoleAllowed, normalizeRole } from "@/lib/auth";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

const routeRoles: Record<string, string[]> = {
  "/appointments": ["OWNER", "MANAGER", "RECEPTIONIST"],
  "/calendar": ["OWNER", "MANAGER", "RECEPTIONIST"],
  "/customers": ["OWNER", "MANAGER", "RECEPTIONIST"],
  "/services": ["OWNER", "MANAGER"],
  "/rooms": ["OWNER", "MANAGER"],
  "/packages": ["OWNER", "MANAGER"],
  "/memberships": ["OWNER", "MANAGER", "RECEPTIONIST"],
  "/payments": ["OWNER", "MANAGER", "RECEPTIONIST"],
  "/profile": ["OWNER", "MANAGER", "RECEPTIONIST", "THERAPIST"],
  "/staff": ["OWNER"],
  "/line-chart": ["OWNER", "MANAGER"],
  "/bar-chart": ["OWNER", "MANAGER"],
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const session = getStoredAuth();
    if (!session) {
      router.replace("/signin");
      return;
    }

    const allowedRoles = routeRoles[pathname];
    if (allowedRoles && !isRoleAllowed(session.user.role, allowedRoles)) {
      router.replace("/");
    }
  }, [pathname, router]);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
