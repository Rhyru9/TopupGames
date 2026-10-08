import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { PopupForm } from "@/components/console/popup/popup-form";
import { formatPopupDateTimeLocal } from "@/lib/content/popup-form";
import type { SitePopupModeValue } from "@/lib/content/popup-form";
import { prisma } from "@/lib/prisma";

type EditPopupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPopupPage({ params }: EditPopupPageProps) {
  const { id } = await params;
  const popup = await prisma.sitePopup.findUnique({ where: { id } });
  if (!popup) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Edit Popup"
        description={popup.title}
        backLink={{
          href: "/console/popup",
          label: "← Kembali ke daftar popup",
        }}
      />

      <div className="console-panel console-panel--padded">
        <PopupForm
          mode="edit"
          popupId={popup.id}
          initialValues={{
            title: popup.title,
            mode: popup.mode as SitePopupModeValue,
            body: popup.body ?? "",
            imageUrl: popup.imageUrl ?? "",
            ctaLabel: popup.ctaLabel,
            ctaHref: popup.ctaHref,
            dismissMinutes: popup.dismissMinutes,
            sortOrder: popup.sortOrder,
            startsAt: formatPopupDateTimeLocal(popup.startsAt),
            endsAt: formatPopupDateTimeLocal(popup.endsAt),
            isActive: popup.isActive,
          }}
        />
      </div>
    </div>
  );
}
