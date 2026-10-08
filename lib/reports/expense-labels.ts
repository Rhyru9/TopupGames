import type { ExpenseCategory } from "@/app/generated/prisma/client";

export const EXPENSE_CATEGORIES = [
  "ADS",
  "OPERATIONAL",
  "INFRASTRUCTURE",
  "SALARY",
  "OTHER",
] as const satisfies readonly ExpenseCategory[];

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategoryValue, string> = {
  ADS: "Iklan / Marketing",
  OPERATIONAL: "Operasional",
  INFRASTRUCTURE: "Infrastruktur / Server",
  SALARY: "Gaji / Honor",
  OTHER: "Lainnya",
};

export function isExpenseCategory(value: string): value is ExpenseCategoryValue {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}
