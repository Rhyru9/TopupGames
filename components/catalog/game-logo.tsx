"use client";

import { useState } from "react";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

export function GameLogo({
  game,
  className = "h-full w-full object-cover",
  priority = false,
}: {
  game: { name: string; logo: string };
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !game.logo) {
    return (
      <span className={`flex items-center justify-center font-display text-3xl font-extrabold text-neon/80 sm:text-4xl ${className}`}>
        {initialsOf(game.name)}
      </span>
    );
  }

  return (
    <img
      src={game.logo}
      alt={game.name}
      className={className}
      referrerPolicy="no-referrer"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      onError={() => setFailed(true)}
    />
  );
}
