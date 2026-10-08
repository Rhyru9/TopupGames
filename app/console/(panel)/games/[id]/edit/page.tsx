import { redirect } from "next/navigation";

type EditGameRedirectProps = {
  params: Promise<{ id: string }>;
};

export default async function EditGameRedirectPage({ params }: EditGameRedirectProps) {
  const { id } = await params;
  redirect(`/console/produk/${id}/edit`);
}
