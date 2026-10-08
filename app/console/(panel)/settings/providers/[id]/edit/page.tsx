import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type EditProviderRedirectProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProviderRedirectPage({ params }: EditProviderRedirectProps) {
  const { id } = await params;

  const provider = await prisma.fulfillmentProvider.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!provider) {
    redirect("/console/settings/providers");
  }

  redirect(`/console/settings/providers?provider=${provider.slug}`);
}
