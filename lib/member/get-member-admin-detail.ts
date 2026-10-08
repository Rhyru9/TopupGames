import { prisma } from "@/lib/prisma";
import { isMemberStatusActive } from "@/lib/member/member-status";

export type MemberAdminDetail = {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  whatsapp: string | null;
  image: string | null;
  hasGoogle: boolean;
  hasPassword: boolean;
  emailVerified: Date | null;
  isActive: boolean;
  status: string;
  statusReason: string | null;
  statusAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  saldo: number;
  poin: number;
  orderCount: number;
  depositCount: number;
  recentOrders: {
    id: string;
    orderCode: string;
    productNameSnapshot: string;
    amount: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: Date;
  }[];
};

export async function getMemberAdminDetail(id: string): Promise<MemberAdminDetail | null> {
  const row = await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      memberCode: true,
      name: true,
      email: true,
      whatsapp: true,
      image: true,
      googleId: true,
      passwordHash: true,
      emailVerified: true,
      isActive: true,
      status: true,
      statusReason: true,
      statusAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      balance: { select: { saldo: true, poin: true } },
      _count: { select: { orders: true, deposits: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderCode: true,
          productNameSnapshot: true,
          amount: true,
          paymentStatus: true,
          fulfillmentStatus: true,
          createdAt: true,
        },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    memberCode: row.memberCode,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    image: row.image,
    hasGoogle: Boolean(row.googleId),
    hasPassword: Boolean(row.passwordHash),
    emailVerified: row.emailVerified,
    isActive: row.isActive && isMemberStatusActive(row.status),
    status: row.status,
    statusReason: row.statusReason,
    statusAt: row.statusAt,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    saldo: row.balance?.saldo ?? 0,
    poin: row.balance?.poin ?? 0,
    orderCount: row._count.orders,
    depositCount: row._count.deposits,
    recentOrders: row.orders,
  };
}
