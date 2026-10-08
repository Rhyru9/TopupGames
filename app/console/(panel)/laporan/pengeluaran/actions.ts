"use server";

import { assertConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  deleteExpenseById,
  parseExpenseForm,
  persistExpense,
  validateExpenseInput,
  type ExpenseFormState,
} from "@/lib/reports/get-expense-mutations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { ExpenseFormState };

const expenseToasts = {
  created: "Pengeluaran ditambahkan.",
  updated: "Pengeluaran diperbarui.",
  deleted: "Pengeluaran dihapus.",
};

function revalidateExpensePaths() {
  revalidatePath("/console/laporan");
  revalidatePath("/console/laporan/pengeluaran");
  revalidatePath("/console/laporan/pemasukan");
}

export async function saveExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const expenseId = String(formData.get("expenseId") ?? "").trim() || undefined;
  const input = parseExpenseForm(formData);
  const validation = validateExpenseInput(input);
  if (validation) return validation;

  const result = await persistExpense(input, {
    expenseId,
    adminId: gate.admin.id,
  });
  if (result) return result;

  revalidateExpensePaths();
  redirect(
    withToastUrl(
      "/console/laporan/pengeluaran",
      expenseId ? expenseToasts.updated : expenseToasts.created,
    ),
  );
}

export async function deleteExpense(formData: FormData) {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) {
    redirect(withToastUrl("/console/laporan/pengeluaran", gate.error, "error"));
  }

  const expenseId = String(formData.get("expenseId") ?? "").trim();
  if (!expenseId) return;

  await deleteExpenseById(expenseId);
  revalidateExpensePaths();
  redirect(withToastUrl("/console/laporan/pengeluaran", expenseToasts.deleted));
}
