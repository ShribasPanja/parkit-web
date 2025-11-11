"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  icon?: string;
  subtitle?: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  required = false,
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

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
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="text-2xl flex-shrink-0">
                  {selectedOption.icon}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {selectedOption.label}
                </div>
                {selectedOption.subtitle && (
                  <div className="text-xs text-slate-500 truncate">
                    {selectedOption.subtitle}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-sm text-slate-400 font-medium">
              {placeholder}
            </span>
          )}
        </div>

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
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full flex items-center gap-3 px-5 py-4 text-left transition-colors
                  ${
                    option.value === value
                      ? "bg-emerald-50 border-l-4 border-emerald-500"
                      : "hover:bg-slate-50 border-l-4 border-transparent"
                  }
                `}
              >
                {option.icon && (
                  <span className="text-2xl flex-shrink-0">{option.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold truncate ${
                      option.value === value
                        ? "text-emerald-900"
                        : "text-slate-900"
                    }`}
                  >
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div
                      className={`text-xs truncate ${
                        option.value === value
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {option.subtitle}
                    </div>
                  )}
                </div>
                {option.value === value && (
                  <svg
                    className="w-5 h-5 text-emerald-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
