"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveExpense,
  type ExpenseFormState,
} from "@/app/console/(panel)/laporan/pengeluaran/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategoryValue,
} from "@/lib/reports/expense-labels";

export type ExpenseFormValues = {
  date: string;
  category: ExpenseCategoryValue;
  description: string;
  amount: number;
  receiptUrl: string;
};

type ExpenseFormProps = {
  mode: "create" | "edit";
  expenseId?: string;
  initialValues?: Partial<ExpenseFormValues>;
};

const initialState: ExpenseFormState = {};

export function ExpenseForm(props: ExpenseFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <ExpenseFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function ExpenseFormContent({ mode, expenseId, initialValues }: ExpenseFormProps) {
  const [state, formAction, pending] = useActionState(saveExpense, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(formAction);
  const isSaving = pending || isUploading;

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const values: ExpenseFormValues = {
    date: defaultDate,
    category: "OTHER",
    description: "",
    amount: 0,
    receiptUrl: "",
    ...initialValues,
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="console-form">
      {mode === "edit" && expenseId ? (
        <input type="hidden" name="expenseId" value={expenseId} />
      ) : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      {uploadError ? (
        <div className="console-alert console-alert--error" role="alert">
          {uploadError}
        </div>
      ) : null}

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Detail pengeluaran</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="date" className="console-field__label">
                Tanggal *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={values.date}
                required
                className="console-input w-full"
              />
            </div>

            <div className="console-field">
              <label htmlFor="category" className="console-field__label">
                Kategori *
              </label>
              <select
                id="category"
                name="category"
                defaultValue={values.category}
                className="console-input w-full"
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {EXPENSE_CATEGORY_LABEL[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="console-field">
              <label htmlFor="amount" className="console-field__label">
                Nominal (Rp) *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min={1}
                step={1}
                defaultValue={values.amount || ""}
                required
                className="console-input w-full"
                placeholder="50000"
              />
              {state.fieldErrors?.amount ? (
                <p className="console-field__error">{state.fieldErrors.amount}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="description" className="console-field__label">
                Deskripsi *
              </label>
              <input
                id="description"
                name="description"
                type="text"
                defaultValue={values.description}
                required
                maxLength={500}
                className="console-input w-full"
                placeholder="Biaya iklan Meta Ads minggu ini"
              />
              {state.fieldErrors?.description ? (
                <p className="console-field__error">{state.fieldErrors.description}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <ConsoleImageUpload
                name="receiptUrl"
                kind="expense-receipt"
                label="Bukti (opsional)"
                initialValue={values.receiptUrl}
                hint="Upload struk / invoice jika ada."
                error={state.fieldErrors?.receiptUrl}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" className="console-btn-primary" disabled={isSaving}>
          {isSaving ? "Menyimpan…" : mode === "edit" ? "Simpan perubahan" : "Tambah pengeluaran"}
        </button>
        <Link href="/console/laporan/pengeluaran" className="console-btn-secondary">
          Batal
        </Link>
      </div>
    </form>
  );
}
