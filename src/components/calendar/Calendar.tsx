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

const initialEvents: CalendarEvent[] = [
  {
    id: "apt-1",
    title: "Amaka Okafor — Deep Tissue",
    start: "2026-09-16T09:00:00",
    end: "2026-09-16T10:00:00",
    extendedProps: {
      calendar: "Success",
      customer: "Amaka Okafor",
      service: "Deep tissue massage",
      therapist: "Adaeze",
      room: "Room 02",
      status: "Confirmed",
    },
  },
  {
    id: "apt-2",
    title: "Tolu Williams — Glow Facial",
    start: "2026-09-16T11:00:00",
    end: "2026-09-16T12:00:00",
    extendedProps: {
      calendar: "Primary",
      customer: "Tolu Williams",
      service: "Glow facial",
      therapist: "Nneka",
      room: "Room 01",
      status: "Checked in",
    },
  },
  {
    id: "apt-3",
    title: "Chiamaka Eze — Aromatherapy",
    start: "2026-09-16T14:00:00",
    end: "2026-09-16T15:00:00",
    extendedProps: {
      calendar: "Warning",
      customer: "Chiamaka Eze",
      service: "Aromatherapy",
      therapist: "Miriam",
      room: "Suite 03",
      status: "Pending",
    },
  },
  {
    id: "apt-4",
    title: "David Cole — Couples Retreat",
    start: "2026-09-17T16:00:00",
    end: "2026-09-17T18:00:00",
    extendedProps: {
      calendar: "Danger",
      customer: "David Cole",
      service: "Couples retreat",
      therapist: "Adaeze & Nneka",
      room: "VIP Suite",
      status: "Pending",
    },
  },
];

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventCustomer, setEventCustomer] = useState("");
  const [eventService, setEventService] = useState("");
  const [eventTherapist, setEventTherapist] = useState("");
  const [eventRoom, setEventRoom] = useState("");
  const [eventStatus, setEventStatus] = useState("Confirmed");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("Success");
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

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
    setEventStatus(event.extendedProps.status || "Confirmed");
    setEventStartDate(formatDateInput(event.start as string | Date | null | undefined));
    setEventEndDate(formatDateInput(event.end as string | Date | null | undefined));
    setEventLevel(event.extendedProps.calendar || "Success");
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    const normalizedStart = eventStartDate || new Date().toISOString().slice(0, 16);
    const normalizedEnd = eventEndDate || normalizedStart;

    const eventData = {
      title: eventTitle || "New appointment",
      start: normalizedStart,
      end: normalizedEnd,
      extendedProps: {
        calendar: eventLevel,
        customer: eventCustomer,
        service: eventService,
        therapist: eventTherapist,
        room: eventRoom,
        status: eventStatus,
      },
    };

    if (selectedEvent) {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? { ...event, ...eventData }
            : event
        )
      );
    } else {
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        ...eventData,
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
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
    setEventStatus("Confirmed");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("Success");
    setSelectedEvent(null);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
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
                Customer
              </label>
              <input
                type="text"
                value={eventCustomer}
                onChange={(e) => setEventCustomer(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Service
              </label>
              <input
                type="text"
                value={eventService}
                onChange={(e) => setEventService(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Therapist
              </label>
              <input
                type="text"
                value={eventTherapist}
                onChange={(e) => setEventTherapist(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Room
              </label>
              <input
                type="text"
                value={eventRoom}
                onChange={(e) => setEventRoom(e.target.value)}
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
              {selectedEvent ? "Update appointment" : "Save appointment"}
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
