import type { ConsoleNavIconName } from "./nav-config";

const iconClass = "h-[18px] w-[18px] shrink-0";

export function ConsoleNavIcon({ name }: { name: ConsoleNavIconName }) {
  switch (name) {
    case "dashboard":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" strokeLinejoin="round" />
        </svg>
      );
    case "games":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" strokeLinecap="round" />
          <rect x="3" y="6" width="18" height="12" rx="3" />
        </svg>
      );
    case "categories":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 7h7M4 12h7M4 17h7" strokeLinecap="round" />
          <path d="M14 7h6M14 12h6M14 17h6" strokeLinecap="round" />
        </svg>
      );
    case "products":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        </svg>
      );
    case "orders":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
        </svg>
      );
    case "deposits":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M7 14h.01M11 14h2" strokeLinecap="round" />
        </svg>
      );
    case "banners":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="11" r="1.5" />
          <path d="M12 15l3-3 3 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ticker":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 8h16M4 12h10M4 16h13" strokeLinecap="round" />
          <path d="M18 10l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
     case "bell":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="11" r="1.5" />
          <path d="M4.616 20q-.691 0-1.153-.462T3 18.384V5.616q0-.691.463-1.153T4.615 4h14.77q.69 0 1.152.463T21 5.616v12.769q0 .69-.463 1.153T19.385 20zm2.153-3.5h4.462v-1H6.769zm0-4h4.462v-1H6.769zm0-4h4.462v-1H6.769zm9.462 8h1v-1h-1zm0-4h1v-5h-1z" />
        </svg>
      );
      case "news":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="11" r="1.5" />
          <path fill="currentColor" d="M19.875 3H4.125C2.953 3 2 3.897 2 5v14c0 1.103.953 2 2.125 2h15.75C21.047 21 22 20.103 22 19V5c0-1.103-.953-2-2.125-2m0 16H4.125c-.057 0-.096-.016-.113-.016q-.01 0-.012.008L3.988 5.046c.007-.01.052-.046.137-.046h15.75c.079.001.122.028.125.008l.012 13.946c-.007.01-.052.046-.137.046" />
          <path fill="currentColor" d="M6 7h6v6H6zm7 8H6v2h12v-2h-4zm1-4h4v2h-4zm0-4h4v2h-4z" />
        </svg>
      );
    case "members":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-2.2 2.7-4 6-4s6 1.8 6 4" strokeLinecap="round" />
          <path d="M16 8.5a2.5 2.5 0 1 1 0 5M19 19c0-1.5-1.5-2.8-3.5-3.2" strokeLinecap="round" />
        </svg>
      );
    case "website":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" strokeLinecap="round" />
        </svg>
      );
    case "payment":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" strokeLinecap="round" />
        </svg>
      );
    case "providers":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="4" y="4" width="16" height="6" rx="1.5" />
          <rect x="4" y="14" width="16" height="6" rx="1.5" />
          <path d="M8 7h.01M8 17h.01" strokeLinecap="round" />
        </svg>
      );
    case "vouchers":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M4 15v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
        </svg>
      );
    case "flash":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M13 2L4 14h7l-1 8 10-13h-7l1-7z" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "whitelist":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3l7 4v5c0 4.4-3 8.5-7 9-4-.5-7-4.6-7-9V7l7-4z" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "reports":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 19V5M4 19h16" strokeLinecap="round" />
          <path d="M8 16v-5M12 16V8M16 16v-3" strokeLinecap="round" />
        </svg>
      );
    case "income":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 21V9M8 17l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 3h14" strokeLinecap="round" />
        </svg>
      );
    case "expense":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 21h14" strokeLinecap="round" />
        </svg>
      );
    case "admins":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" strokeLinecap="round" />
          <path d="M17.5 4.5l1.5 1.5 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "seo":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16.5 16.5L21 21" strokeLinecap="round" />
          <path d="M9 11h4M11 9v4" strokeLinecap="round" />
        </svg>
      );
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ConsoleAvatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-10 w-10 text-sm" : size === "sm" ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${dim} rounded-full object-cover ring-1 ring-line`} />
    );
  }

  return (
    <span className={`console-avatar ${dim}`}>
      {initials(name)}
    </span>
  );
}
