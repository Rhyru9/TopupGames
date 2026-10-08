import { redirect } from "next/navigation";

type EditProductRedirectProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductRedirectPage({ params }: EditProductRedirectProps) {
  const { id } = await params;
  redirect(`/console/product-skus/${id}/edit`);
}
