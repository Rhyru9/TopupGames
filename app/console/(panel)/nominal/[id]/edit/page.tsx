import { redirect } from "next/navigation";

type NominalEditRedirectProps = {
  params: Promise<{ id: string }>;
};

export default async function NominalEditRedirectPage({ params }: NominalEditRedirectProps) {
  const { id } = await params;
  redirect(`/console/product-skus/${id}/edit`);
}
