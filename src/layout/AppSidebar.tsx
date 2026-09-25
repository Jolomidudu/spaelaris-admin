"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { getStoredAuth, normalizeRole } from "../lib/auth";
import {
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <CalenderIcon />,
    name: "Appointments",
    path: "/appointments",
  },
  {
    icon: <UserCircleIcon />,
    name: "Staff & Therapists",
    path: "/staff",
  },
  {
    name: "Services",
    icon: <ListIcon />,
    path: "/services",
  },
  {
    name: "Customers",
    icon: <TableIcon />,
    path: "/customers",
  },
  {
    name: "Locations",
    icon: <PageIcon />,
    path: "/rooms",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Reports",
    path: "/line-chart",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Packages",
    path: "/packages",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Memberships",
    path: "/memberships",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Payments",
    path: "/payments",
  },
  {
    icon: <PlugInIcon />,
    name: "My profile",
    path: "/profile",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const [role, setRole] = useState("OWNER");

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    setRole(normalizeRole(getStoredAuth()?.user.role) || "OWNER");
  }, []);

  const normalizedRole = normalizeRole(role);

  const visibleNavItems = useMemo(() => {
    if (normalizedRole === "OWNER") return navItems;
    if (normalizedRole === "MANAGER") {
      return navItems.filter((item) => item.name !== "Staff & Therapists");
    }
    if (normalizedRole === "RECEPTIONIST") {
      return navItems.filter((item) => ["Dashboard", "Appointments", "Customers"].includes(item.name));
    }
    return navItems.filter((item) => ["Dashboard"].includes(item.name));
  }, [normalizedRole]);

  const visibleOtherItems = useMemo(() => {
    if (normalizedRole === "OWNER" || normalizedRole === "MANAGER") return othersItems;
    if (normalizedRole === "RECEPTIONIST") {
      return othersItems.filter((item) => ["Memberships", "Payments", "My profile"].includes(item.name));
    }
    return othersItems.filter((item) => ["My profile"].includes(item.name));
  }, [normalizedRole]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-2">
      {items.map((nav) => (
        <li key={nav.name}>
          <Link
            href={nav.path}
            onClick={closeSidebarOnMobile}
            className={`menu-item group ${
              nav.path === pathname ? "menu-item-active" : "menu-item-inactive"
            }`}
          >
            <span className={nav.path === pathname ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
              {nav.icon}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text">{nav.name}</span>
            )}
          </Link>
        </li>
      ))}
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
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(visibleNavItems)}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(visibleOtherItems)}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
