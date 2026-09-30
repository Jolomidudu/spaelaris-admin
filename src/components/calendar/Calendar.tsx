"use client";
import React, { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { getAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    customer?: string;
    service?: string;
    therapist?: string;
    room?: string;
    status?: string;
  };
}

type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  customer: { firstName: string; lastName: string; phone: string };
  therapist: { firstName: string; lastName: string } | null;
  location: { name: string; city: string };
  room: { name: string } | null;
  services: { name: string; durationMinutes: number; quantity: number }[];
};

type AppointmentOptions = {
  locations: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
  services: { id: string; name: string; slug: string; durationMinutes: number | null; priceKobo: number; category: { id: string; name: string; slug: string } }[];
  therapists: { id: string; staffProfileId: string; email: string; firstName: string; lastName: string; locationSlug: string; serviceSlugs: string[] }[];
  rooms: { id: string; name: string; locationSlug: string }[];
};

type AppointmentSlot = {
  startsAt: string;
  endsAt: string;
  therapistId: string;
  therapistName: string;
  availableRooms: { id: string; name: string }[];
};

const ANY_ROOM_VALUE = "__any_room__";
const PHONE_COUNTRY_CODES = [
  { code: "+234", country: "Nigeria" },
  { code: "+1", country: "United States / Canada" },
  { code: "+44", country: "United Kingdom" },
  { code: "+27", country: "South Africa" },
  { code: "+254", country: "Kenya" },
  { code: "+233", country: "Ghana" },
  { code: "+971", country: "United Arab Emirates" },
];

function getDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatBookingTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00+01:00`));
}

function getCalendarLevel(status: string) {
  if (status === "CANCELLED" || status === "NO_SHOW") return "Danger";
  if (status === "PENDING") return "Warning";
  if (status === "CHECKED_IN" || status === "IN_SERVICE") return "Primary";
  return "Success";
}

function toCalendarEvent(appointment: Appointment): CalendarEvent {
  const customer = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
  const service = appointment.services.map((item) => item.name).join(", ") || "Spa treatment";
  const therapist = appointment.therapist
    ? `${appointment.therapist.firstName} ${appointment.therapist.lastName}`
    : "Unassigned";

  return {
    id: appointment.id,
    title: `${customer} — ${service}`,
    start: appointment.startsAt,
    end: appointment.endsAt,
    extendedProps: {
      calendar: getCalendarLevel(appointment.status),
      customer,
      service,
      therapist,
      room: appointment.room?.name || "Unassigned",
      status: appointment.status,
    },
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerPhoneCountryCode, setCustomerPhoneCountryCode] = useState("+234");
  const [customerPhoneDigits, setCustomerPhoneDigits] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [eventService, setEventService] = useState("");
  const [eventServiceCategory, setEventServiceCategory] = useState("");
  const [eventTherapist, setEventTherapist] = useState("");
  const [eventRoom, setEventRoom] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }));
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{ customer: string; phone: string; category: string; service: string; amount: string; note: string; location: string; therapist: string; room: string; date: string; time: string } | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [appointmentOptions, setAppointmentOptions] = useState<AppointmentOptions>({ locations: [], categories: [], services: [], therapists: [], rooms: [] });
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  React.useEffect(() => {
    async function loadAppointments() {
      const token = getAccessToken();

      if (!token) {
        setLoadError("Your session has expired. Please sign in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Unable to load appointments.");
        const appointments = (await response.json()) as Appointment[];
        setEvents(appointments.map(toCalendarEvent));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to load appointments.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAppointments();
  }, []);

  React.useEffect(() => {
    async function loadAppointmentOptions() {
      const token = getAccessToken();
      if (!token) {
        setOptionsError("Your session has expired. Please sign in again.");
        setIsLoadingOptions(false);
        return;
      }

      try {
        let options: AppointmentOptions;
        const response = await fetch(`${API_BASE_URL}/api/appointments/options`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          options = await response.json() as AppointmentOptions;
          const roomResponse = await fetch(`${API_BASE_URL}/api/rooms`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null);
          if (roomResponse?.ok) {
            const roomPayload = await roomResponse.json() as unknown;
            const actualRooms = Array.isArray(roomPayload) ? roomPayload.flatMap((room: { id?: string; name?: string; location?: { slug?: string }; locationSlug?: string }) => {
              const locationSlug = room.location?.slug ?? room.locationSlug;
              return room.id && room.name && locationSlug ? [{ id: room.id, name: room.name, locationSlug }] : [];
            }) : [];
            if (actualRooms.length > 0) options.rooms = actualRooms;
          }
          if (!Array.isArray(options.rooms)) options.rooms = [];
        } else {
          const [locationResponse, catalogResponse, therapistResponse, roomResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/public/locations`),
            fetch(`${API_BASE_URL}/api/public/catalog`),
            fetch(`${API_BASE_URL}/api/public/therapists`),
            fetch(`${API_BASE_URL}/api/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const [locations, catalog, publicTherapists] = await Promise.all([
            locationResponse.json(),
            catalogResponse.json(),
            therapistResponse.json(),
          ]);
          if (!locationResponse.ok || !catalogResponse.ok || !therapistResponse.ok) {
            throw new Error("Booking lists are unavailable. The API needs the latest appointments update.");
          }
          const roomRows = roomResponse.ok ? await roomResponse.json() : [];
          options = {
            locations,
            categories: catalog.map(({ id, name, slug }: { id: string; name: string; slug: string }) => ({ id, name, slug })),
            services: catalog.flatMap((category: { id: string; name: string; slug: string; services: { id: string; name: string; slug: string; durationMinutes: number | null; priceKobo: number }[] }) =>
              category.services.map((service) => ({ ...service, category: { id: category.id, name: category.name, slug: category.slug } })),
            ),
            therapists: publicTherapists.map((therapist: { id: string; publicSlug: string; name: string; location: { slug: string }; services: { slug: string }[] }) => {
              const [firstName, ...lastNameParts] = therapist.name.split(" ");
              return { id: therapist.id, staffProfileId: therapist.id, email: "", firstName, lastName: lastNameParts.join(" "), locationSlug: therapist.location.slug, serviceSlugs: therapist.services.map(({ slug }) => slug) };
            }),
            rooms: roomRows.length > 0
              ? roomRows.map((room: { id: string; name: string; location: { slug: string } }) => ({ id: room.id, name: room.name, locationSlug: room.location.slug }))
              : locations.flatMap((location: { rooms?: { id: string; name: string }[]; slug: string }) => (location.rooms ?? []).map((room) => ({ ...room, locationSlug: location.slug }))),
          };
        }
        setAppointmentOptions(options);
        setEventLocation(options.locations[0]?.slug ?? "");
        setEventServiceCategory(options.categories[0]?.slug ?? "");
      } catch (error) {
        setOptionsError(error instanceof Error ? error.message : "Unable to load booking options.");
      } finally {
        setIsLoadingOptions(false);
      }
    }

    void loadAppointmentOptions();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setSaveError("");
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const formatDateInput = (value: string | Date | null | undefined) => {
    if (!value) {
      return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().slice(0, 16);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event as unknown as CalendarEvent;
    resetModalFields();
    setSelectedEvent(event);
    setEventStartDate(formatDateInput(event.start as string | Date | null | undefined));
    setEventEndDate(formatDateInput(event.end as string | Date | null | undefined));
    openModal();
  };

  const handleNewAppointment = () => {
    resetModalFields();
    setSaveError("");
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    const normalizedStart = selectedSlot ? selectedSlot.startsAt : eventStartDate || new Date().toISOString().slice(0, 16);
    const normalizedEnd = selectedSlot ? selectedSlot.endsAt : eventEndDate || normalizedStart;
    let confirmation: typeof confirmedBooking = null;

    const token = getAccessToken();
    if (!token) {
      setSaveError("Your session has expired. Please sign in again.");
      return;
    }

    setSaveError("");
    setIsSaving(true);

    try {
      if (selectedEvent) {
        const response = await fetch(`${API_BASE_URL}/api/appointments/${selectedEvent.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            startsAt: normalizedStart,
            endsAt: normalizedEnd,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to update appointment.");
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/appointments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerPhone: `${customerPhoneCountryCode}${customerPhoneDigits}`,
            customerFirstName,
            customerLastName,
            customerNote: customerNote.trim() || undefined,
            serviceSlug: eventService,
            locationSlug: eventLocation,
            therapistProfileId: eventTherapist || undefined,
            roomName: selectedRoom?.name || undefined,
            startsAt: normalizedStart,
            endsAt: normalizedEnd,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Unable to save appointment.");
        }

      }
      const refreshResponse = await fetch(`${API_BASE_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!refreshResponse.ok) throw new Error("Appointment was saved, but the calendar could not refresh.");
      const appointments = (await refreshResponse.json()) as Appointment[];
      setEvents(appointments.map(toCalendarEvent));
      if (!selectedEvent && selectedSlot) {
        confirmation = {
          customer: `${customerFirstName.trim()} ${customerLastName.trim()}`,
          phone: `${customerPhoneCountryCode} ${customerPhoneDigits}`,
          category: appointmentOptions.categories.find((category) => category.slug === eventServiceCategory)?.name ?? "",
          service: selectedService?.name ?? "",
          amount: new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(totalPrice / 100),
          note: customerNote.trim(),
          location: appointmentOptions.locations.find((location) => location.slug === eventLocation)?.name ?? "",
          therapist: selectedTherapist ? `${selectedTherapist.firstName} ${selectedTherapist.lastName}` : "",
          room: selectedRoom?.name ?? "",
          date: formatBookingDate(selectedDate),
          time: formatBookingTime(selectedSlot.startsAt),
        };
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save appointment.");
      return;
    } finally {
      setIsSaving(false);
    }

    closeModal();
    resetModalFields();
    if (confirmation) {
      setConfirmedBooking(confirmation);
      setIsConfirmationOpen(true);
    }
  };

  const resetModalFields = () => {
    setCustomerFirstName("");
    setCustomerLastName("");
    setCustomerPhoneCountryCode("+234");
    setCustomerPhoneDigits("");
    setCustomerNote("");
    setEventService("");
    setEventServiceCategory(appointmentOptions.categories[0]?.slug ?? "");
    setEventTherapist("");
    setEventRoom("");
    setEventLocation(appointmentOptions.locations[0]?.slug ?? "");
    setEventStartDate("");
    setEventEndDate("");
    setBookingStep(1);
    setSelectedDate(getDateKey(new Date()));
    setAvailableSlots([]);
    setSelectedSlot(null);
    setSlotError("");
    setSelectedEvent(null);
  };

  const availableServices = appointmentOptions.services.filter((service) => service.category.slug === eventServiceCategory);
  const availableTherapists = appointmentOptions.therapists.filter((therapist) =>
    therapist.locationSlug === eventLocation && (!eventService || therapist.serviceSlugs.includes(eventService)),
  );
  const availableRooms = appointmentOptions.rooms.filter((room) => room.locationSlug === eventLocation);
  const selectedService = appointmentOptions.services.find((service) => service.slug === eventService);
  const selectedRoom = eventRoom === ANY_ROOM_VALUE
    ? appointmentOptions.rooms.find((room) => room.id === selectedSlot?.availableRooms?.[0]?.id)
    : appointmentOptions.rooms.find((room) => room.id === eventRoom);
  const selectedTherapist = appointmentOptions.therapists.find((therapist) => therapist.staffProfileId === eventTherapist);
  const totalPrice = selectedService?.priceKobo ?? 0;
  const dateChoices = Array.from({ length: 21 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return getDateKey(date);
  });
  const visibleTimeSlots = availableSlots.filter((slot) => {
    if (slot.therapistId !== eventTherapist) return false;
    const selectedRoomIsAvailable = eventRoom === ANY_ROOM_VALUE
      ? slot.availableRooms ? slot.availableRooms.length > 0 : (slot as AppointmentSlot & { availableRoomCount?: number }).availableRoomCount !== 0
      : slot.availableRooms
        ? slot.availableRooms.some((room) => room.id === eventRoom)
        : (slot as AppointmentSlot & { availableRoomCount?: number }).availableRoomCount !== 0;
    const [hour, minute] = formatBookingTime(slot.startsAt).split(":").map(Number);
    const startMinute = hour * 60 + minute;
    return selectedRoomIsAvailable && startMinute >= 9 * 60 && startMinute + (selectedService?.durationMinutes ?? 0) <= 18 * 60;
  });

  async function loadAvailability(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotError("");
    setIsLoadingSlots(true);
    try {
      const params = new URLSearchParams({ locationSlug: eventLocation, date, serviceSlugs: eventService });
      const response = await fetch(`${API_BASE_URL}/api/public/booking/availability?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Unable to load available times.");
      setAvailableSlots(payload.slots as AppointmentSlot[]);
    } catch (error) {
      setSlotError(error instanceof Error ? error.message : "Unable to load available times.");
    } finally {
      setIsLoadingSlots(false);
    }
  }

  function goToNextStep() {
    setSaveError("");
    const validPhone = customerPhoneCountryCode === "+234"
      ? /^\d{10}$/.test(customerPhoneDigits)
      : /^\d{7,15}$/.test(customerPhoneDigits);
    if (bookingStep === 1 && (!customerFirstName.trim() || !customerLastName.trim() || !validPhone || !eventLocation)) {
      setSaveError(customerPhoneCountryCode === "+234"
        ? "Enter the guest's name, a 10-digit Nigerian phone number, and a location."
        : "Enter the guest's name, a valid phone number, and a location.");
      return;
    }
    if (bookingStep === 2 && (!eventServiceCategory || !eventService || !eventTherapist || !eventRoom)) {
      setSaveError("Select a category, service, therapist, and room to continue.");
      return;
    }
    if (bookingStep === 3 && !selectedSlot) {
      setSaveError("Choose an available date and time to continue.");
      return;
    }
    if (bookingStep === 2) void loadAvailability(selectedDate);
    setBookingStep((current) => Math.min(5, current + 1));
  }

  function goToPreviousStep() {
    setSaveError("");
    setBookingStep((current) => Math.max(1, current - 1));
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        {loadError && <p className="px-5 py-4 text-sm text-error-600 dark:text-error-400">{loadError}</p>}
        {isLoading && <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Loading appointments...</p>}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          customButtons={{
            addEventButton: {
              text: "New Spaelaris Booking +",
              click: handleNewAppointment,
            },
          }}
        />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} backdropClassName="fixed inset-0 h-full w-full bg-transparent" className="max-h-[92vh] max-w-3xl overflow-hidden border border-white/70 bg-white/60 p-0 shadow-xl backdrop-blur-xl">
        <form onSubmit={(event) => { event.preventDefault(); if (selectedEvent || bookingStep === 5) void handleAddOrUpdateEvent(); else goToNextStep(); }} className="appointment-form flex max-h-[92vh] flex-col bg-white/60">
          <header className="shrink-0 border-b border-brand-200 px-6 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-4 pr-10">
              <div>
                <h2 className="text-xl font-semibold text-brand-900">{selectedEvent ? "Edit appointment" : bookingStep === 5 ? "Review booking" : "New Spaelaris Booking"}</h2>
                <p className="mt-1 text-sm text-gray-600">{selectedEvent ? selectedEvent.extendedProps.customer : `Step ${bookingStep} of 5`}</p>
              </div>
            </div>
            {!selectedEvent && <div className="mt-5 flex items-center" aria-label={`Step ${bookingStep} of 5`}>{[1, 2, 3, 4, 5].map((step) => <React.Fragment key={step}><span aria-current={step === bookingStep ? "step" : undefined} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${step === bookingStep ? "border-brand-600 bg-brand-600 text-white" : step < bookingStep ? "border-brand-200 bg-brand-100 text-brand-800" : "border-gray-300 bg-white text-gray-500"}`}>{step < bookingStep ? "✓" : step}</span>{step < 5 && <span className={`mx-2 h-0.5 flex-1 ${step < bookingStep ? "bg-brand-500" : "bg-gray-200"}`} />}</React.Fragment>)}</div>}
          </header>

          {saveError && <p role="alert" className="mx-6 mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-8">{saveError}</p>}
          {optionsError && !selectedEvent && <p role="alert" className="mx-6 mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-8">{optionsError}</p>}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 custom-scrollbar sm:px-8">
            {selectedEvent ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-800">Start date &amp; time</label>
                  <input required type="datetime-local" value={eventStartDate} onChange={(event) => setEventStartDate(event.target.value)} className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-800">End date &amp; time</label>
                  <input required type="datetime-local" value={eventEndDate} onChange={(event) => setEventEndDate(event.target.value)} className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden" />
                </div>
              </div>
            ) : (
              <>
                {bookingStep === 1 && <div className="grid gap-5 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Customer first name</label><input autoFocus required value={customerFirstName} onChange={(event) => setCustomerFirstName(event.target.value)} autoComplete="given-name" className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden" /></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Customer last name</label><input required value={customerLastName} onChange={(event) => setCustomerLastName(event.target.value)} autoComplete="family-name" className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden" /></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Customer phone</label><div className="flex h-11 overflow-hidden rounded-lg border border-brand-200 bg-white"><select aria-label="Customer phone country code" value={customerPhoneCountryCode} onChange={(event) => { setCustomerPhoneCountryCode(event.target.value); setCustomerPhoneDigits(""); }} className="max-w-44 border-r border-brand-200 bg-brand-50 px-2 text-xs font-medium text-brand-800 focus:outline-hidden">{PHONE_COUNTRY_CODES.map(({ code, country }) => <option key={code} value={code}>{country} {code}</option>)}</select><input required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={customerPhoneCountryCode === "+234" ? 10 : 15} pattern={customerPhoneCountryCode === "+234" ? "[0-9]{10}" : "[0-9]{7,15}"} value={customerPhoneDigits} onChange={(event) => { const digits = event.target.value.replace(/\D/g, ""); setCustomerPhoneDigits(digits.slice(0, customerPhoneCountryCode === "+234" ? 10 : 15)); }} placeholder={customerPhoneCountryCode === "+234" ? "8012345678" : "Phone number"} className="min-w-0 flex-1 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden" /></div><p className="mt-1 text-xs text-gray-600">{customerPhoneCountryCode === "+234" ? "Enter exactly 10 digits." : "Enter 7 to 15 digits."}</p></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Location</label><select required value={eventLocation} onChange={(event) => { setEventLocation(event.target.value); setEventTherapist(""); setEventRoom(""); setSelectedSlot(null); }} disabled={isLoadingOptions} className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"><option value="">{isLoadingOptions ? "Loading locations..." : "Select location"}</option>{appointmentOptions.locations.map((location) => <option key={location.id} value={location.slug}>{location.name}</option>)}</select></div>
                </div>}

                {bookingStep === 2 && <div className="grid gap-5 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Service category</label><select required value={eventServiceCategory} onChange={(event) => { setEventServiceCategory(event.target.value); setEventService(""); setEventTherapist(""); setSelectedSlot(null); }} disabled={isLoadingOptions} className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"><option value="">Select category</option>{appointmentOptions.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Service</label><select required value={eventService} onChange={(event) => { setEventService(event.target.value); setEventTherapist(""); setSelectedSlot(null); }} disabled={!eventServiceCategory || isLoadingOptions} className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"><option value="">Select service</option>{availableServices.map((service) => <option key={service.id} value={service.slug}>{service.name}{service.durationMinutes ? ` · ${service.durationMinutes} min` : ""}</option>)}</select></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Therapist</label><select required value={eventTherapist} onChange={(event) => { setEventTherapist(event.target.value); setSelectedSlot(null); }} disabled={!eventLocation || !eventService || isLoadingOptions} className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"><option value="">Select therapist</option>{availableTherapists.map((therapist) => <option key={therapist.staffProfileId} value={therapist.staffProfileId}>{therapist.firstName} {therapist.lastName}</option>)}</select>{eventService && availableTherapists.length === 0 && <p className="mt-1 text-xs text-[#9a5637]">No therapist at this location is assigned to the selected service.</p>}</div>
                  <div><label className="mb-1.5 block text-sm font-medium text-brand-800">Room</label><select required value={eventRoom} onChange={(event) => { setEventRoom(event.target.value); setSelectedSlot(null); }} disabled={!eventLocation || isLoadingOptions} className="h-11 w-full rounded-lg border border-brand-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden"><option value="">Select room</option><option value={ANY_ROOM_VALUE}>Any room</option>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></div>
                </div>}

                {bookingStep === 3 && <div>
                  <h3 className="text-lg font-semibold text-brand-900">Select a date</h3>
                  <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3" aria-label="Available dates">
                    {dateChoices.map((date) => {
                      const [weekday, day, month] = formatBookingDate(date).split(" ");
                      return <button key={date} type="button" onClick={() => void loadAvailability(date)} className={`flex h-28 w-[88px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl border transition ${selectedDate === date ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 bg-white text-brand-800 hover:border-brand-500"}`}><span className="text-sm">{weekday}</span><strong className="text-2xl">{day}</strong><span className="text-sm">{month}</span></button>;
                    })}
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-semibold text-brand-900">Pick a time</h3>
                    {slotError && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{slotError}</p>}
                    {isLoadingSlots ? <p className="mt-3 text-sm text-gray-600">Loading available times...</p> : visibleTimeSlots.length > 0 ? <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">{visibleTimeSlots.map((slot) => <button key={`${slot.startsAt}-${slot.therapistId}`} type="button" onClick={() => setSelectedSlot(slot)} className={`flex min-h-14 w-full items-center justify-between rounded-xl border px-4 text-left transition ${selectedSlot?.startsAt === slot.startsAt ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200 bg-white text-brand-900 hover:border-brand-500"}`}><span className="text-base font-semibold">{formatBookingTime(slot.startsAt)}</span><span className="text-xs">{formatBookingTime(slot.endsAt)} end</span></button>)}</div> : <p className="mt-3 rounded-lg bg-brand-25 px-4 py-5 text-sm text-gray-600">{eventService && eventTherapist && eventRoom ? "No matching times between 09:00 and 18:00 on this date." : "Choose a service, therapist, and room first."}</p>}
                  </div>
                </div>}

                {bookingStep === 4 && <div><label className="mb-2 block text-sm font-medium text-brand-800">Customer note</label><p className="mb-3 text-sm text-gray-600">Add preferences or details the front desk and therapist should know.</p><textarea autoFocus value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} rows={6} maxLength={1000} placeholder="Add a note for this guest..." className="w-full resize-y rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden" /><p className="mt-1 text-right text-xs text-gray-600">{customerNote.length}/1000</p></div>}

                {bookingStep === 5 && <div>
                  <h3 className="text-lg font-semibold text-brand-900">Review booking</h3>
                  <dl className="mt-4 divide-y divide-brand-200 rounded-xl border border-brand-200 bg-white px-4">
                    {[ ["Guest", `${customerFirstName} ${customerLastName}`], ["Phone", `${customerPhoneCountryCode} ${customerPhoneDigits}`], ["Location", appointmentOptions.locations.find((location) => location.slug === eventLocation)?.name ?? ""], ["Category", appointmentOptions.categories.find((category) => category.slug === eventServiceCategory)?.name ?? ""], ["Treatment", selectedService?.name ?? ""], ["Date", formatBookingDate(selectedDate)], ["Time", selectedSlot ? `${formatBookingTime(selectedSlot.startsAt)} - ${formatBookingTime(selectedSlot.endsAt)}` : ""], ["Therapist", selectedTherapist ? `${selectedTherapist.firstName} ${selectedTherapist.lastName}` : ""], ["Room", selectedRoom?.name ?? ""], ["Amount", new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(totalPrice / 100)]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="text-gray-600">{label}</dt><dd className="text-right font-medium text-brand-900">{value}</dd></div>)}
                    {customerNote.trim() && <div className="py-3 text-sm"><dt className="text-gray-600">Customer note</dt><dd className="mt-1 whitespace-pre-wrap text-brand-900">{customerNote}</dd></div>}
                  </dl>
                </div>}
              </>
            )}
          </div>

          <footer className="shrink-0 border-t border-white/50 bg-white/60 px-6 py-4 sm:px-8">
            {!selectedEvent && bookingStep === 2 && <div className="mb-4 flex items-center justify-between border-b border-brand-200 pb-3 text-sm"><span className="text-gray-600">Selected service</span><span className="font-semibold text-brand-900">{selectedService ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(totalPrice / 100) : "Select a service"}</span></div>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {selectedEvent ? <><button onClick={closeModal} type="button" className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save changes"}</button></> : bookingStep === 5 ? <><button onClick={closeModal} type="button" className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800">Cancel</button><button type="submit" disabled={isSaving || !selectedSlot} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">{isSaving ? "Confirming..." : "Confirm booking"}</button></> : <><button onClick={goToPreviousStep} type="button" disabled={bookingStep === 1} className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 disabled:invisible">Previous</button><button onClick={goToNextStep} type="button" disabled={isLoadingOptions || Boolean(optionsError) || (bookingStep === 3 && (isLoadingSlots || !selectedSlot))} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">Next</button></>}
            </div>
          </footer>
        </form>
      </Modal>

      <Modal isOpen={isConfirmationOpen} onClose={() => setIsConfirmationOpen(false)} className="appointment-confirmation max-w-md bg-brand-25 p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-800">✓</div>
          <h2 className="mt-4 text-2xl font-semibold text-brand-900">Booking Confirmed</h2>
          <p className="mt-2 text-sm text-gray-600">{confirmedBooking?.customer}&apos;s appointment is booked.</p>
        </div>
        {confirmedBooking && <dl className="mt-5 space-y-2 rounded-xl bg-white p-4 text-sm text-brand-800">{[["Phone", confirmedBooking.phone], ["Category", confirmedBooking.category], ["Treatment", confirmedBooking.service], ["Amount", confirmedBooking.amount], ["Location", confirmedBooking.location], ["Date & time", `${confirmedBooking.date}, ${confirmedBooking.time}`], ["Therapist", confirmedBooking.therapist], ["Room", confirmedBooking.room]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-gray-600">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}{confirmedBooking.note && <div className="border-t border-brand-200 pt-2"><dt className="text-gray-600">Customer note</dt><dd className="mt-1 whitespace-pre-wrap">{confirmedBooking.note}</dd></div>}</dl>}
        <button type="button" onClick={() => setIsConfirmationOpen(false)} className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white">Close</button>
      </Modal>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const calendar = eventInfo.event.extendedProps.calendar || "Success";
  const colorClass = `fc-bg-${calendar.toLowerCase()}`;

  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
