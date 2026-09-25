import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Appointments" />
      <Calendar />
    </div>
  );
}
