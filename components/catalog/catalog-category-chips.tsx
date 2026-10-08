"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { CategoryIcon } from "@/components/catalog/category-icon";
import type { LandingCatalogCategory } from "@/lib/catalog-products/get-landing-catalog";

function CatalogAllIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function CatalogCategoryChips({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: LandingCatalogCategory[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollState();
    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null;
    observer?.observe(el);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [categories]);

  useEffect(() => {
    updateScrollState();
  }, [activeCategoryId, categories]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.55), behavior: "smooth" });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth + 2) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) <= 6) return;

    if (!drag.moved) {
      drag.moved = true;
      el.classList.add("catalog-neon__chips--dragging");
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    el.scrollLeft = drag.scrollLeft - delta;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    const wasDragging = drag.moved;
    drag.active = false;
    el.classList.remove("catalog-neon__chips--dragging");
    if (wasDragging) {
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    if (!wasDragging) drag.moved = false;
  }

  function onChipClick(categoryId: string, event: MouseEvent<HTMLButtonElement>) {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
      return;
    }
    onSelect(categoryId);
  }

  return (
    <div
      className={`catalog-neon__chips-bar${canScrollLeft ? " catalog-neon__chips-bar--left" : ""}${
        canScrollRight ? " catalog-neon__chips-bar--right" : ""
      }`}
    >
      {canScrollLeft ? (
        <button
          type="button"
          className="catalog-neon__chips-nav catalog-neon__chips-nav--prev"
          aria-label="Geser kategori ke kiri"
          onClick={() => scrollByDir(-1)}
        >
          ‹
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        className="catalog-neon__chips"
        role="tablist"
        aria-label="Filter kategori"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCategoryId === "all"}
          className={`catalog-neon__chip${activeCategoryId === "all" ? " catalog-neon__chip--active" : ""}`}
          onClick={(event) => onChipClick("all", event)}
        >
          <span className="catalog-neon__chip-icon" aria-hidden>
            <CatalogAllIcon />
          </span>
          <span className="catalog-neon__chip-label">Semua</span>
        </button>
        {categories.map((category) => {
          const active = activeCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`catalog-neon__chip${active ? " catalog-neon__chip--active" : ""}`}
              onClick={(event) => onChipClick(category.id, event)}
            >
              <CategoryIcon
                icon={category.iconUrl}
                name={category.name}
                className="catalog-neon__chip-icon"
                size={22}
              />
              <span className="catalog-neon__chip-label">{category.name}</span>
            </button>
          );
        })}
      </div>

      {canScrollRight ? (
        <button
          type="button"
          className="catalog-neon__chips-nav catalog-neon__chips-nav--next"
          aria-label="Geser kategori ke kanan"
          onClick={() => scrollByDir(1)}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
