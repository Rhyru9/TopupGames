"use client";

import { useState } from "react";

type ConsoleSecretInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
};

export function ConsoleSecretInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  required,
}: ConsoleSecretInputProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const maskedDisplay = value.length > 0 ? "*".repeat(value.length) : "";

  return (
    <div className="console-input-secret">
      <input type="hidden" name={name} value={value} />

      {visible ? (
        <input
          id={id}
          type="text"
          value={value}
          required={required && value.length === 0}
          placeholder={placeholder}
          autoComplete="off"
          className="console-input console-input-secret__field w-full"
          onChange={(event) => setValue(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type="text"
          readOnly
          value={maskedDisplay}
          placeholder={placeholder}
          autoComplete="off"
          className="console-input console-input-secret__field console-input-secret__field--masked w-full"
          onFocus={() => setVisible(true)}
        />
      )}

      <button
        type="button"
        className="console-input-secret__toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Sembunyikan nilai" : "Tampilkan nilai"}
        title={visible ? "Sembunyikan" : "Tampilkan"}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M3 3l18 18" strokeLinecap="round" />
            <path d="M10.6 10.6a2 2 0 1 0 2.8 2.8" />
            <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.2 11.2 0 0 1-2.1 3.2M6.7 6.7A11.2 11.2 0 0 0 1 12.5C2.7 16.9 7 20 12 20a10.8 10.8 0 0 0 4.9-1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M1 12.5C2.7 8.1 7 5 12 5s9.3 3.1 11 7.5c-1.7 4.4-6 7.5-11 7.5S2.7 16.9 1 12.5z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12.5" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
