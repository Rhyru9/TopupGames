import { ExpenseCategory } from "@/app/generated/prisma/client";
import { cleanupReplacedImage, deleteStoredImage } from "@/lib/storage/delete-stored-image";
import { validateImageUrl } from "@/lib/storage/image-url";
import { prisma } from "@/lib/prisma";
import {
  isExpenseCategory,
  type ExpenseCategoryValue,
} from "@/lib/reports/expense-labels";
import type { ExpenseListItem } from "@/lib/reports/report-types";

export type ExpenseFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ExpenseFormInput = {
  date: Date;
  category: ExpenseCategoryValue;
  description: string;
  amount: number;
  receiptUrl: string;
};

function parseDateOnly(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatExpenseDateInput(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function parseExpenseForm(formData: FormData): ExpenseFormInput {
  const amountRaw = Number.parseInt(String(formData.get("amount") ?? "0"), 10);
  const categoryRaw = String(formData.get("category") ?? "OTHER").trim().toUpperCase();
  const date = parseDateOnly(String(formData.get("date") ?? "")) ?? new Date();

  return {
    date,
    category: isExpenseCategory(categoryRaw) ? categoryRaw : "OTHER",
    description: String(formData.get("description") ?? "").trim(),
    amount: Number.isFinite(amountRaw) ? Math.max(0, amountRaw) : 0,
    receiptUrl: String(formData.get("receiptUrl") ?? "").trim(),
  };
}

export function validateExpenseInput(input: ExpenseFormInput): ExpenseFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.description) {
    fieldErrors.description = "Deskripsi wajib diisi.";
  } else if (input.description.length > 500) {
    fieldErrors.description = "Deskripsi maksimal 500 karakter.";
  }

  if (input.amount < 1) {
    fieldErrors.amount = "Nominal minimal 1.";
  }

  if (input.receiptUrl) {
    const imageError = validateImageUrl(input.receiptUrl);
    if (imageError) fieldErrors.receiptUrl = imageError;
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export async function listExpenses(options?: {
  skip?: number;
  take?: number;
  from?: Date;
  to?: Date;
}): Promise<{ items: ExpenseListItem[]; total: number }> {
  const where =
    options?.from && options?.to
      ? { date: { gte: options.from, lte: options.to } }
      : undefined;

  const [rows, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        date: true,
        category: true,
        description: true,
        amount: true,
        receiptUrl: true,
        updatedAt: true,
        createdByAdmin: { select: { name: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    total,
    items: rows.map((row) => ({
      id: row.id,
      date: row.date,
      category: row.category,
      description: row.description,
      amount: row.amount,
      receiptUrl: row.receiptUrl,
      createdByName: row.createdByAdmin?.name ?? null,
      updatedAt: row.updatedAt,
    })),
  };
}

export async function persistExpense(
  input: ExpenseFormInput,
  options?: { expenseId?: string; adminId?: string },
): Promise<ExpenseFormState | null> {
  const data = {
    date: input.date,
    category: input.category as ExpenseCategory,
    description: input.description,
    amount: input.amount,
    receiptUrl: input.receiptUrl || null,
  };

  if (options?.expenseId) {
    const existing = await prisma.expense.findUnique({ where: { id: options.expenseId } });
    if (!existing) return { error: "Pengeluaran tidak ditemukan." };

    if (existing.receiptUrl && existing.receiptUrl !== data.receiptUrl) {
      await cleanupReplacedImage(existing.receiptUrl, data.receiptUrl ?? "");
    } else if (existing.receiptUrl && !data.receiptUrl) {
      await deleteStoredImage(existing.receiptUrl);
    }

    await prisma.expense.update({
      where: { id: options.expenseId },
      data,
    });
  } else {
    await prisma.expense.create({
      data: {
        ...data,
        createdByAdminId: options?.adminId || null,
      },
    });
  }

  return null;
}

export async function deleteExpenseById(expenseId: string): Promise<void> {
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) return;
  await prisma.expense.delete({ where: { id: expenseId } });
  if (existing.receiptUrl) await deleteStoredImage(existing.receiptUrl);
}
