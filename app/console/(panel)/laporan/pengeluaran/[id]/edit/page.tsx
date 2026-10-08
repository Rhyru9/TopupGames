import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ExpenseForm } from "@/components/console/laporan/expense-form";
import {
  formatExpenseDateInput,
} from "@/lib/reports/get-expense-mutations";
import { isExpenseCategory } from "@/lib/reports/expense-labels";
import { prisma } from "@/lib/prisma";

type EditExpensePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Laporan"
        title="Edit pengeluaran"
        description="Perbarui detail beban operasional."
        backLink={{
          href: "/console/laporan/pengeluaran",
          label: "← Kembali ke daftar pengeluaran",
        }}
      />

      <div className="console-panel console-panel--padded">
        <ExpenseForm
          mode="edit"
          expenseId={expense.id}
          initialValues={{
            date: formatExpenseDateInput(expense.date),
            category: isExpenseCategory(expense.category) ? expense.category : "OTHER",
            description: expense.description,
            amount: expense.amount,
            receiptUrl: expense.receiptUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
