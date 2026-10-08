import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { MemberDetailHeaderActions } from "@/components/console/members/member-detail-header-actions";
import { MemberDetailView } from "@/components/console/members/member-detail-view";
import { getMemberAdminDetail } from "@/lib/member/get-member-admin-detail";

type MemberDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  const member = await getMemberAdminDetail(id);
  if (!member) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Member"
        title={member.name}
        description={`${member.memberCode} · ${member.email}`}
        backLink={{
          href: "/console/members",
          label: "← Kembali ke daftar member",
        }}
        actionsSlot={<MemberDetailHeaderActions member={member} />}
      />

      <MemberDetailView member={member} />
    </div>
  );
}
