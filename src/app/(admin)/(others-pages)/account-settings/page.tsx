import AccountSecurity from "@/components/user-profile/AccountSecurity";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings | Spaelaris Admin",
  description: "Manage account security settings.",
};

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Account Settings" />
      <AccountSecurity />
    </div>
  );
}