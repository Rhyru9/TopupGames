"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
  type TransitionEvent,
} from "react";

export type BannerSliderSlide = {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
};

type BannerSliderProps = {
  slides: BannerSliderSlide[];
};

function wrapPos(pos: number, total: number) {
  if (pos === 0) return total;
  if (pos === total + 1) return 1;
  if (pos < 0 || pos > total + 1) {
    return ((((pos - 1) % total) + total) % total) + 1;
  }
  return pos;
}

function isWrapPos(pos: number, total: number) {
  return pos <= 0 || pos >= total + 1;
}

export function BannerSlider({ slides }: BannerSliderProps) {
  const total = slides.length;

  const rootRef = useRef<HTMLElement>(null);
  const posRef = useRef(1);
  const startX = useRef<number | null>(null);
  const skipClick = useRef(false);

  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const canLoop = total > 1;
  const loopSlides = canLoop ? [slides[total - 1], ...slides, slides[0]] : slides;
  const loopCount = loopSlides.length;

  const realIndex = canLoop ? wrapPos(pos, total) - 1 : 0;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  const snapIfNeeded = useCallback(() => {
    if (!canLoop) return;
    const current = posRef.current;
    if (!isWrapPos(current, total)) return;
    setAnimate(false);
    const next = wrapPos(current, total);
    posRef.current = next;
    setPos(next);
  }, [canLoop, total]);

  const step = useCallback(
    (dir: number) => {
      if (!canLoop) return;
      const current = posRef.current;
      const from = isWrapPos(current, total) ? wrapPos(current, total) : current;
      setAnimate(true);
      const next = from + dir;
      posRef.current = next;
      setPos(next);
    },
    [canLoop, total],
  );

  const goTo = useCallback(
    (i: number) => {
      if (!canLoop) return;
      setAnimate(true);
      const next = i + 1;
      posRef.current = next;
      setPos(next);
    },
    [canLoop],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0.08;
        setInView(visible);
        if (!visible) snapIfNeeded();
      },
      { threshold: [0, 0.08, 0.25] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [snapIfNeeded]);

  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden") snapIfNeeded();
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [snapIfNeeded]);

  useEffect(() => {
    if (!canLoop || paused || dragging || !inView || reducedMotion) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") step(1);
    }, 5200);
    return () => window.clearInterval(id);
  }, [canLoop, dragging, inView, paused, reducedMotion, step]);

  useEffect(() => {
    if (!canLoop || !isWrapPos(pos, total)) return;
    const id = window.setTimeout(snapIfNeeded, 780);
    return () => window.clearTimeout(id);
  }, [canLoop, pos, snapIfNeeded, total]);

  useEffect(() => {
    if (animate) return;
    let nestedFrame: number | null = null;
    const frame = requestAnimationFrame(() => {
      nestedFrame = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(frame);
      if (nestedFrame !== null) cancelAnimationFrame(nestedFrame);
    };
  }, [animate]);

  if (total === 0) {
    return null;
  }

  function onTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform") return;
    snapIfNeeded();
  }

  function onTouchStart(e: TouchEvent) {
    if (!canLoop) return;
    startX.current = e.touches[0].clientX;
    setDragging(true);
    setPaused(true);
  }

  function onTouchMove(e: TouchEvent) {
    if (startX.current == null) return;
    setDrag(e.touches[0].clientX - startX.current);
  }

  function onTouchEnd() {
    if (startX.current == null) return;
    if (Math.abs(drag) > 36) {
      skipClick.current = true;
      step(drag > 0 ? -1 : 1);
    }
    startX.current = null;
    setDrag(0);
    setDragging(false);
    setPaused(false);
  }

  const trackPos = canLoop ? pos : 0;

  return (
    <section
      ref={rootRef}
      id="hero"
      className="storefront-banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      aria-label="Promo pilihan"
      aria-roledescription="carousel"
    >
      <div className="storefront-banner__shell">
        <div className="storefront-banner__viewport">
          <div
            className={`storefront-banner__track ${animate && !dragging && canLoop ? "is-animating" : ""}`}
            style={{
              width: `${loopCount * 100}%`,
              transform: `translate3d(calc(${(-trackPos / loopCount) * 100}% + ${drag}px), 0, 0)`,
            }}
            onTransitionEnd={onTransitionEnd}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            {loopSlides.map((slide, i) => {
              const linkHref = slide.href || undefined;
              // Loop clones share a URL: keep its loading policy consistent for Next's LCP observer.
              const initialImage = slide.imageUrl === slides[0].imageUrl;
              const media = (
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  loading={initialImage ? "eager" : "lazy"}
                  fetchPriority={initialImage ? "high" : "low"}
                  sizes="(max-width: 768px) 100vw, (max-width: 1400px) 100vw, 1400px"
                  className="object-contain object-center"
                  draggable={false}
                />
              );

              return (
                <div
                  key={`${slide.id}-${i}`}
                  className="storefront-banner__item"
                  style={{ width: `${100 / loopCount}%` }}
                >
                  {linkHref ? (
                    <Link
                      href={linkHref}
                      onClick={(e) => {
                        if (skipClick.current) {
                          e.preventDefault();
                          skipClick.current = false;
                        }
                      }}
                      className="storefront-banner__slide"
                      aria-hidden={canLoop ? i !== pos : false}
                      tabIndex={canLoop && i !== pos ? -1 : undefined}
                    >
                      {media}
                    </Link>
                  ) : (
                    <div
                      className="storefront-banner__slide"
                      aria-hidden={canLoop ? i !== pos : false}
                    >
                      {media}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {canLoop ? (
          <div className="storefront-banner__dots">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                aria-current={i === realIndex ? "true" : undefined}
                onClick={() => goTo(i)}
                className={`storefront-banner__dot ${i === realIndex ? "is-active" : ""}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
