import { getMemberSession } from "@/lib/member-auth";
import { hasInvoiceAccess } from "@/lib/orders/invoice-access";
import { prisma } from "@/lib/prisma";
import { toPublicInvoiceDto, type PublicInvoiceDto } from "@/lib/orders/order-helpers";

export async function getPublicInvoiceByCode(
  orderCode: string,
): Promise<PublicInvoiceDto | null> {
  const code = orderCode.trim();
  if (!code) return null;

  const session = await getMemberSession();
  const guestAccess = await hasInvoiceAccess(code);
  const memberId = session?.user?.id;
  if (!guestAccess && !memberId) return null;
  const order = await prisma.order.findFirst({
    where: { orderCode: code, ...(guestAccess ? {} : { memberId: memberId! }) },
    include: {
      product: { select: { slug: true } },
      wallet: { select: { poinUsed: true, saldoUsed: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          channel: true,
          channelName: true,
          payCode: true,
          qrUrl: true,
          checkoutUrl: true,
          expiredAt: true,
          paidAt: true,
          createdAt: true,
          rawCreateResponse: true,
        },
      },
    },
  });

  if (!order) return null;
  return toPublicInvoiceDto(order);
}
