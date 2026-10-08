"use client";

import { Icon } from "@iconify/react";
import { isIconifyIconId } from "@/lib/catalog-categories/iconify-icon";

type CategoryIconProps = {
  icon: string | null | undefined;
  name: string;
  className?: string;
  size?: number;
};

/** Render Iconify icon kategori; fallback inisial huruf. */
export function CategoryIcon({ icon, name, className, size = 18 }: CategoryIconProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const iconId = icon?.trim() ?? "";

  if (isIconifyIconId(iconId)) {
    return (
      <span className={className} aria-hidden>
        <Icon icon={iconId} width={size} height={size} />
      </span>
    );
  }

  return (
    <span className={className} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
        <rect
          x="3.5"
          y="3.5"
          width="17"
          height="17"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="currentColor"
          fontSize="11"
          fontWeight="800"
          fontFamily="var(--font-display), ui-sans-serif, system-ui, sans-serif"
        >
          {initial}
        </text>
      </svg>
    </span>
  );
}
