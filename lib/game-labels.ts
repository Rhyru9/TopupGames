export const gameStatusOptions = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "HIDDEN", label: "Disembunyikan" },
] as const;

export type GameStatusValue = (typeof gameStatusOptions)[number]["value"];

export function gameStatusLabel(status: string) {
  return gameStatusOptions.find((item) => item.value === status)?.label ?? status;
}
