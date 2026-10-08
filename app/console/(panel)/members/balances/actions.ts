"use server";

import { assertConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import { applyMemberLedgerAdjustment } from "@/lib/member/member-ledger";
import { memberLedgerToasts } from "@/lib/member/member-ledger-labels";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type MemberLedgerFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"kind" | "direction" | "amount" | "reason", string>>;
};

export async function adjustMemberBalance(
  _prevState: MemberLedgerFormState,
  formData: FormData,
): Promise<MemberLedgerFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const memberId = String(formData.get("memberId") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "").trim();
  const directionRaw = String(formData.get("direction") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!memberId) return { error: "Member tidak valid." };

  const kind = kindRaw === "POIN" ? "POIN" : kindRaw === "SALDO" ? "SALDO" : null;
  const direction =
    directionRaw === "DEBIT" ? "DEBIT" : directionRaw === "CREDIT" ? "CREDIT" : null;
  const amount = Number.parseInt(amountRaw.replace(/\D/g, "") || "0", 10);

  const fieldErrors: MemberLedgerFormState["fieldErrors"] = {};
  if (!kind) fieldErrors.kind = "Pilih jenis mutasi.";
  if (!direction) fieldErrors.direction = "Pilih arah mutasi.";
  if (!Number.isFinite(amount) || amount < 1) fieldErrors.amount = "Jumlah minimal 1.";
  if (reason.length < 3) fieldErrors.reason = "Keterangan wajib diisi.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali data mutasi.", fieldErrors };
  }

  const result = await applyMemberLedgerAdjustment({
    memberId,
    kind: kind!,
    direction: direction!,
    amount,
    reason,
    adminId: gate.admin.id,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/console/members/balances");
  revalidatePath(`/console/members/balances/${memberId}`);
  revalidatePath("/console/members");
  redirect(
    withToastUrl(
      `/console/members/balances/${memberId}`,
      memberLedgerToasts.adjusted,
    ),
  );
}
