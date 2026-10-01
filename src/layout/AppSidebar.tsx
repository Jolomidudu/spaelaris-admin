"use client";
import React, { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bed,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  ShieldUser,
  SquareChartGantt,
  SquareText,
  Users,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { getStoredRoleSnapshot, subscribeToAuthChanges } from "../lib/auth";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: <SquareChartGantt color="#6f7f3f" />,
    name: "Overview",
    path: "/",
  },
  {
    icon: <CalendarDays color="#6f7f3f" />,
    name: "Appointments",
    path: "/appointments",
  },
  {
    icon: <Users color="#344054" />,
    name: "Staff & Therapists",
    path: "/staff",
  },
  {
    name: "Services",
    icon: <SquareText color="#6f7f3f"/>,
    path: "/services",
  },
  {
    name: "Customers",
    icon: <Users color="#6f7f3f" />,
    path: "/customers",
  },
  {
    name: "Rooms",
    icon: <Bed color="#6f7f3f" />,
    path: "/rooms",
  },
  {
    icon: <CreditCard color="#6f7f3f" />,
    name: "Payments",
    path: "/payments",
  },
  {
    icon: <Bell color="#6f7f3f" />,
    name: "Notifications",
    path: "/notifications",
  },
  {
    icon: <ShieldUser />,
    name: "My profile",
    path: "/profile",
  },
  // {
  //   icon: <Settings color="#6f7f3f" />,
  //   name: "Account Settings",
  //   path: "/account-settings",
  // },
  {
    icon: <ChartNoAxesCombined color="#6f7f3f" />,
    name: "Reports",
    path: "/line-chart",
  },
  {
    icon: <ChartNoAxesCombined color="#6f7f3f" />,
    name: "System Settings",
    path: "#",
    disabled: true,
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const role = useSyncExternalStore(subscribeToAuthChanges, getStoredRoleSnapshot, () => "OWNER");

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const normalizedRole = role;

  const visibleNavItems = useMemo(() => {
    if (normalizedRole === "OWNER") return navItems;
    if (normalizedRole === "MANAGER") {
      return navItems.filter((item) => item.name !== "Staff & Therapists" && item.name !== "System Settings");
    }
    if (normalizedRole === "RECEPTIONIST") {
      return navItems.filter((item) => ["Overview", "Appointments", "Customers", "Payments", "Notifications", "My profile"].includes(item.name));
    }
    return navItems.filter((item) => ["Notifications", "My profile"].includes(item.name));
  }, [normalizedRole]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-2">
      {items.map((nav) => {
        const isActive = nav.path === pathname;
        const itemClassName = `menu-item group ${isActive ? "menu-item-active" : "menu-item-inactive"} ${nav.disabled ? "cursor-not-allowed opacity-50" : ""}`;
        const itemContents = (
          <>
            <span className={isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}>{nav.icon}</span>
            {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
          </>
        );

        return (
          <li key={nav.name}>
            {nav.disabled ? (
              <span aria-disabled="true" title={`${nav.name} is not available yet`} className={itemClassName}>
                {itemContents}
              </span>
            ) : (
              <Link href={nav.path} onClick={closeSidebarOnMobile} className={itemClassName}>
                {itemContents}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`hidden py-8 lg:flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/selogo.png"
                alt="Logo"
                width={75}
                height={20}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/selogo.png"
                alt="Logo"
                width={75}
                height={20}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          {renderMenuItems(visibleNavItems)}
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
