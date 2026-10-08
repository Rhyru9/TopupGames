"use client";

import { useEffect, useState } from "react";

export type FlashSaleCountdownProps = {
  endsAt: string;
  label?: string;
  variant?: "hero" | "inline";
};

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flash-neon__unit">
      <div className="flash-neon__unit-box">
        <span className="flash-neon__unit-value">{value}</span>
      </div>
      <div className="flash-neon__unit-label">{label}</div>
    </div>
  );
}

export function FlashSaleCountdown({
  endsAt,
  label = "Berakhir dalam",
  variant = "hero",
}: FlashSaleCountdownProps) {
  const [remain, setRemain] = useState({ h: "00", m: "00", s: "00" });
  const endsAtMs = new Date(endsAt).getTime();

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, endsAtMs - Date.now());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setRemain({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAtMs]);

  if (variant === "inline") {
    return (
      <div className="flash-sale-countdown-inline" aria-label="Countdown flash sale">
        <span className="flash-sale-countdown-inline__label">{label}</span>
        <span className="flash-sale-countdown-inline__digits">
          {remain.h}:{remain.m}:{remain.s}
        </span>
      </div>
    );
  }

  return (
    <div className="flash-neon__timer" aria-label="Countdown flash sale">
      <p className="flash-neon__timer-label">{label}</p>
      <div className="flash-neon__timer-frame">
        <div className="flash-neon__timer-inner">
          <div className="flash-neon__timer-pattern" aria-hidden />
          <div className="flash-neon__timer-digits">
            <CountdownUnit value={remain.h} label="Jam" />
            <span className="flash-neon__timer-sep" aria-hidden>
              :
            </span>
            <CountdownUnit value={remain.m} label="Menit" />
            <span className="flash-neon__timer-sep" aria-hidden>
              :
            </span>
            <CountdownUnit value={remain.s} label="Detik" />
          </div>
        </div>
      </div>
    </div>
  );
}
