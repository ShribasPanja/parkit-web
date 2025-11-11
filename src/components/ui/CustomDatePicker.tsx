"use client";

import { useState, useRef, useEffect } from "react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  required = false,
  disabled = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value ? new Date(value) : new Date()
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(year, month, day);
    selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const year4 = selectedDate.getFullYear();
    const month2 = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day2 = String(selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year4}-${month2}-${day2}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    if (minDate) {
      const minDateObj = new Date(minDate + "T12:00:00");
      if (date < minDateObj) return true;
    }

    if (maxDate) {
      const maxDateObj = new Date(maxDate + "T12:00:00");
      if (date > maxDateObj) return true;
    }

    return false;
  };

  const isDateSelected = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value + "T00:00:00");
    const compareDate = new Date(year, month, day);

    return (
      selectedDate.getDate() === compareDate.getDate() &&
      selectedDate.getMonth() === compareDate.getMonth() &&
      selectedDate.getFullYear() === compareDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const compareDate = new Date(year, month, day);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);

    return todayDate.getTime() === compareDate.getTime();
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border-2 
          text-left transition-all duration-200 shadow-sm
          ${
            disabled
              ? "bg-slate-100 border-slate-200 cursor-not-allowed"
              : isOpen
              ? "bg-white border-emerald-400 ring-4 ring-emerald-100 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
          }
        `}
      >
        <div className="flex items-center gap-3 flex-1">
          <svg
            className="w-5 h-5 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className="flex-1">
            {value ? (
              <div className="text-sm font-semibold text-slate-900">
                {formatDisplayDate(value)}
              </div>
            ) : (
              <span className="text-sm text-slate-400 font-medium">
                Select a date
              </span>
            )}
          </div>
        </div>

        {value &&
          (() => {
            const selectedDate = new Date(value + "T12:00:00");
            const todayCheck = new Date();
            todayCheck.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            return selectedDate.getTime() === todayCheck.getTime();
          })() && (
            <div className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              Today
            </div>
          )}

        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 w-full max-w-sm mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-emerald-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="text-sm font-bold text-emerald-900">
              {monthNames[month]} {year}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-emerald-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-bold text-slate-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const disabled = isDateDisabled(day);
                const selected = isDateSelected(day);
                const todayDate = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    className={`
                      aspect-square p-2 rounded-lg text-sm font-semibold transition-all
                      ${
                        selected
                          ? "bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-300"
                          : todayDate
                          ? "bg-emerald-100 text-emerald-900 ring-2 ring-emerald-300"
                          : disabled
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-700 hover:bg-slate-100"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
