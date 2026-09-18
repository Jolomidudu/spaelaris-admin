"use client";
import React, { useMemo, useRef, useState } from "react";
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
  const [eventTitle, setEventTitle] = useState("");
  const [eventCustomer, setEventCustomer] = useState("");
  const [eventService, setEventService] = useState("");
  const [eventTherapist, setEventTherapist] = useState("");
  const [eventRoom, setEventRoom] = useState("");
  const [eventLocation, setEventLocation] = useState("lagos");
  const [eventStatus, setEventStatus] = useState("Confirmed");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("Success");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  const calendarsEvents = useMemo(
    () => ({
      Danger: "danger",
      Success: "success",
      Primary: "primary",
      Warning: "warning",
    }),
    []
  );

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
    setSelectedEvent(event);
    setEventTitle(event.title || "");
    setEventCustomer(event.extendedProps.customer || "");
    setEventService(event.extendedProps.service || "");
    setEventTherapist(event.extendedProps.therapist || "");
    setEventRoom(event.extendedProps.room || "");
    setEventLocation("lagos");
    setEventStatus(event.extendedProps.status || "Confirmed");
    setEventStartDate(formatDateInput(event.start as string | Date | null | undefined));
    setEventEndDate(formatDateInput(event.end as string | Date | null | undefined));
    setEventLevel(event.extendedProps.calendar || "Success");
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    const normalizedStart = eventStartDate || new Date().toISOString().slice(0, 16);
    const normalizedEnd = eventEndDate || normalizedStart;

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
            status: eventStatus.toUpperCase().replace(/ /g, "_"),
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
            customerPhone: eventCustomer,
            serviceSlug: eventService,
            locationSlug: eventLocation,
            therapistEmail: eventTherapist || undefined,
            roomName: eventRoom || undefined,
            startsAt: normalizedStart,
            endsAt: normalizedEnd,
            status: eventStatus.toUpperCase().replace(/ /g, "_"),
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
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save appointment.");
      return;
    } finally {
      setIsSaving(false);
    }

    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventCustomer("");
    setEventService("");
    setEventTherapist("");
    setEventRoom("");
    setEventLocation("lagos");
    setEventStatus("Confirmed");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("Success");
    setSelectedEvent(null);
  };

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
              text: "New appointment +",
              click: openModal,
            },
          }}
        />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[760px] p-6 lg:p-10">
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedEvent ? "Edit appointment" : "New appointment"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Book a service, assign a therapist, and reserve a room for the next spa visit.
            </p>
          </div>

          {saveError && <p className="mt-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{saveError}</p>}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Appointment title
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Customer phone
              </label>
              <input
                type="text"
                value={eventCustomer}
                onChange={(e) => setEventCustomer(e.target.value)}
                placeholder="+234 812 123 4567"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Service slug
              </label>
              <input
                type="text"
                value={eventService}
                onChange={(e) => setEventService(e.target.value)}
                placeholder="deep-tissue-massage"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Therapist email
              </label>
              <input
                type="text"
                value={eventTherapist}
                onChange={(e) => setEventTherapist(e.target.value)}
                placeholder="therapist@spaelaris.com"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Room name
              </label>
              <input
                type="text"
                value={eventRoom}
                onChange={(e) => setEventRoom(e.target.value)}
                placeholder="Treatment Room 1"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Location slug</label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="lagos"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Start date & time
              </label>
              <input
                type="datetime-local"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                End date & time
              </label>
              <input
                type="datetime-local"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                Status
              </label>
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {Object.keys(calendarsEvents).map((key) => (
                  <label
                    key={key}
                    className="flex items-center text-sm text-gray-700 dark:text-gray-400"
                    htmlFor={`status-${key}`}
                  >
                    <span className="relative mr-2">
                      <input
                        className="sr-only"
                        type="radio"
                        name="event-status"
                        id={`status-${key}`}
                        checked={eventLevel === key}
                        onChange={() => {
                          setEventLevel(key);
                          setEventStatus(key === "Danger" ? "Cancelled" : key === "Warning" ? "Pending" : key === "Primary" ? "Checked in" : "Confirmed");
                        }}
                      />
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            eventLevel === key ? "block bg-brand-500" : "hidden"
                          }`}
                        ></span>
                      </span>
                    </span>
                    {key}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 sm:justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={handleAddOrUpdateEvent}
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              {isSaving ? "Saving..." : selectedEvent ? "Update appointment" : "Save appointment"}
            </button>
          </div>
        </div>
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
