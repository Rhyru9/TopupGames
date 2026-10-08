import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageClient } from "@/components/content/content-page-client";
import { getContentPageBySlug } from "@/lib/content/get-content-page-by-slug";
import { getMemberSession } from "@/lib/member-auth";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";

type ContentPageRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ContentPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getContentPageBySlug(slug);
  if (!page) {
    return { title: "Halaman tidak ditemukan" };
  }

  let siteName = "R9host";
  try {
    const settings = await getSiteSettings();
    siteName = settings.general.siteName.trim() || siteName;
  } catch {
    // keep default
  }

  return {
    title: `${page.title} — ${siteName}`,
    description: `${page.title} ${siteName}`,
  };
}

export default async function ContentPageRoute({ params }: ContentPageRouteProps) {
  const { slug } = await params;
  const [page, session] = await Promise.all([getContentPageBySlug(slug), getMemberSession()]);
  if (!page) notFound();

  return (
    <ContentPageClient
      title={page.title}
      content={page.content}
      memberName={session?.user?.name ?? null}
      memberImage={session?.user?.image ?? null}
    />
  );
}
