import { redirect } from "next/navigation";

/** Legacy path — use /member */
export default function AccountRedirectPage() {
  redirect("/member");
}
