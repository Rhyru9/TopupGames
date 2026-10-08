-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ProductSkuStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "MemberLedgerKind" AS ENUM ('SALDO', 'POIN');

-- CreateEnum
CREATE TYPE "MemberLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PAID', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "SitePopupMode" AS ENUM ('IMAGE', 'TEXT');

-- CreateEnum
CREATE TYPE "OrderFulfillmentStatus" AS ENUM ('NONE', 'QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfillmentLogAction" AS ENUM ('CREATE', 'POLL', 'WEBHOOK', 'RETRY');

-- CreateEnum
CREATE TYPE "FulfillmentLogStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "MemberEmailTokenType" AS ENUM ('VERIFY', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "PromoVoucherType" AS ENUM ('GENERAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "PromoVoucherDiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "PromoVoucherRedemptionStatus" AS ENUM ('RESERVED', 'CONFIRMED', 'RELEASED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ADS', 'OPERATIONAL', 'INFRASTRUCTURE', 'SALARY', 'OTHER');

-- CreateTable
CREATE TABLE "fulfillment_providers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "docsUrl" VARCHAR(500),
    "config" JSONB,
    "sandboxMode" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supportsCatalogSync" BOOLEAN NOT NULL DEFAULT false,
    "balanceAmount" INTEGER,
    "balanceCurrency" VARCHAR(10),
    "balanceLabel" VARCHAR(80),
    "balanceSyncedAt" TIMESTAMP(3),
    "balanceSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" VARCHAR(500),
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultRequiresLogin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "thumbnailUrl" VARCHAR(500) NOT NULL,
    "bannerUrl" VARCHAR(500) NOT NULL DEFAULT '',
    "requiresZone" BOOLEAN NOT NULL DEFAULT false,
    "requiresLogin" BOOLEAN NOT NULL DEFAULT false,
    "nicknameCheckCode" TEXT,
    "guideHtml" TEXT,
    "fieldHintHtml" TEXT,
    "inputFields" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconUrl" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_skus" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTypeId" TEXT,
    "name" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerSku" TEXT NOT NULL,
    "providerTypeKey" VARCHAR(120),
    "providerProductName" VARCHAR(500),
    "keepCustomName" BOOLEAN NOT NULL DEFAULT false,
    "costPrice" INTEGER NOT NULL,
    "marginGuest" INTEGER NOT NULL DEFAULT 0,
    "marginMember" INTEGER NOT NULL DEFAULT 0,
    "priceGuest" INTEGER NOT NULL,
    "priceMember" INTEGER NOT NULL,
    "cashbackPoin" INTEGER NOT NULL DEFAULT 0,
    "providerCatalogBrand" VARCHAR(500),
    "status" "ProductSkuStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sales" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "headlineAccent" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_items" (
    "id" TEXT NOT NULL,
    "flashSaleId" TEXT NOT NULL,
    "productSkuId" TEXT NOT NULL,
    "priceGuest" INTEGER NOT NULL,
    "priceMember" INTEGER NOT NULL,
    "quota" INTEGER NOT NULL DEFAULT 10,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_vouchers" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "label" VARCHAR(120),
    "type" "PromoVoucherType" NOT NULL,
    "discountType" "PromoVoucherDiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxDiscount" INTEGER NOT NULL DEFAULT 0,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_voucher_redemptions" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "memberId" TEXT,
    "guestKey" VARCHAR(64),
    "discountAmount" INTEGER NOT NULL,
    "status" "PromoVoucherRedemptionStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "promo_voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_providers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "href" VARCHAR(500) NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_popups" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "mode" "SitePopupMode" NOT NULL DEFAULT 'IMAGE',
    "body" TEXT,
    "imageUrl" VARCHAR(500),
    "ctaLabel" VARCHAR(80) NOT NULL DEFAULT '',
    "ctaHref" VARCHAR(500) NOT NULL DEFAULT '',
    "dismissMinutes" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_popups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticker_items" (
    "id" TEXT NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "detail" VARCHAR(160) NOT NULL,
    "href" VARCHAR(500) NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticker_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pages" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showInFooter" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImageUrl" VARCHAR(500) NOT NULL,
    "coverImageAlt" VARCHAR(200) NOT NULL,
    "metaTitle" VARCHAR(200),
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "ogImageUrl" VARCHAR(500),
    "authorName" VARCHAR(120),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "description" VARCHAR(500) NOT NULL,
    "amount" INTEGER NOT NULL,
    "receiptUrl" VARCHAR(500),
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "memberCode" VARCHAR(12) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" VARCHAR(20),
    "passwordHash" TEXT,
    "image" VARCHAR(500),
    "googleId" VARCHAR(120),
    "emailVerified" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusReason" VARCHAR(500),
    "statusAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_balances" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "poin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_ledger_entries" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" "MemberLedgerKind" NOT NULL,
    "direction" "MemberLedgerDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_deposits" (
    "id" TEXT NOT NULL,
    "depositCode" VARCHAR(32) NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "feeSnapshot" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_email_tokens" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "MemberEmailTokenType" NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_email_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "templateKey" VARCHAR(40) NOT NULL,
    "entityType" VARCHAR(20) NOT NULL,
    "entityId" VARCHAR(40) NOT NULL,
    "recipient" VARCHAR(190) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderCode" VARCHAR(32) NOT NULL,
    "memberId" TEXT,
    "productId" TEXT NOT NULL,
    "productSkuId" TEXT NOT NULL,
    "productNameSnapshot" VARCHAR(200) NOT NULL,
    "skuNameSnapshot" VARCHAR(200) NOT NULL,
    "itemSubtotalSnapshot" INTEGER NOT NULL DEFAULT 0,
    "voucherCodeSnapshot" VARCHAR(40),
    "voucherDiscountSnapshot" INTEGER NOT NULL DEFAULT 0,
    "priceSnapshot" INTEGER NOT NULL,
    "feeSnapshot" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL,
    "playerLabel" VARCHAR(255),
    "playerNickname" VARCHAR(120),
    "playerFields" JSONB,
    "email" VARCHAR(190),
    "whatsapp" VARCHAR(20),
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "fulfillmentStatus" "OrderFulfillmentStatus" NOT NULL DEFAULT 'NONE',
    "providerSlug" VARCHAR(40),
    "providerSkuSnapshot" VARCHAR(120),
    "providerRefId" VARCHAR(80),
    "fulfillmentMessage" TEXT,
    "fulfillmentSn" VARCHAR(255),
    "fulfillmentAttemptedAt" TIMESTAMP(3),
    "fulfillmentCompletedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_wallets" (
    "orderId" TEXT NOT NULL,
    "poinUsed" INTEGER NOT NULL DEFAULT 0,
    "saldoUsed" INTEGER NOT NULL DEFAULT 0,
    "walletDebitedAt" TIMESTAMP(3),
    "walletRefundedAt" TIMESTAMP(3),
    "cashbackPoinSnapshot" INTEGER NOT NULL DEFAULT 0,
    "cashbackCreditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_wallets_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "fulfillment_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerSlug" VARCHAR(40) NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "providerRef" VARCHAR(80),
    "action" "FulfillmentLogAction" NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "status" "FulfillmentLogStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "memberDepositId" TEXT,
    "provider" VARCHAR(40) NOT NULL,
    "channel" VARCHAR(40) NOT NULL,
    "channelName" VARCHAR(120),
    "reference" VARCHAR(80) NOT NULL,
    "amount" INTEGER NOT NULL,
    "checkoutUrl" VARCHAR(500),
    "payCode" VARCHAR(120),
    "qrUrl" VARCHAR(500),
    "status" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "expiredAt" TIMESTAMP(3),
    "rawCreateResponse" JSONB,
    "rawCallback" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "general" JSONB NOT NULL DEFAULT '{}',
    "seo" JSONB NOT NULL DEFAULT '{}',
    "storage" JSONB NOT NULL DEFAULT '{}',
    "style" JSONB NOT NULL DEFAULT '{}',
    "pwa" JSONB NOT NULL DEFAULT '{}',
    "auth" JSONB NOT NULL DEFAULT '{}',
    "cron" JSONB NOT NULL DEFAULT '{}',
    "mail" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateways" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "docsUrl" VARCHAR(500),
    "config" JSONB,
    "sandboxMode" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fulfillment_providers_slug_key" ON "fulfillment_providers"("slug");

-- CreateIndex
CREATE INDEX "fulfillment_providers_isActive_sortOrder_idx" ON "fulfillment_providers"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_sortOrder_idx" ON "products"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "products_isPopular_status_sortOrder_idx" ON "products"("isPopular", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "product_types_productId_sortOrder_idx" ON "product_types"("productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "product_types_productId_slug_key" ON "product_types"("productId", "slug");

-- CreateIndex
CREATE INDEX "product_skus_productId_status_costPrice_idx" ON "product_skus"("productId", "status", "costPrice");

-- CreateIndex
CREATE INDEX "product_skus_productId_productTypeId_costPrice_idx" ON "product_skus"("productId", "productTypeId", "costPrice");

-- CreateIndex
CREATE INDEX "product_skus_providerId_idx" ON "product_skus"("providerId");

-- CreateIndex
CREATE INDEX "product_skus_providerSku_idx" ON "product_skus"("providerSku");

-- CreateIndex
CREATE UNIQUE INDEX "product_skus_productId_providerId_providerSku_key" ON "product_skus"("productId", "providerId", "providerSku");

-- CreateIndex
CREATE INDEX "flash_sales_isEnabled_startsAt_endsAt_idx" ON "flash_sales"("isEnabled", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "flash_sales_sortOrder_idx" ON "flash_sales"("sortOrder");

-- CreateIndex
CREATE INDEX "flash_sale_items_flashSaleId_sortOrder_idx" ON "flash_sale_items"("flashSaleId", "sortOrder");

-- CreateIndex
CREATE INDEX "flash_sale_items_productSkuId_idx" ON "flash_sale_items"("productSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sale_items_flashSaleId_productSkuId_key" ON "flash_sale_items"("flashSaleId", "productSkuId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_vouchers_code_key" ON "promo_vouchers"("code");

-- CreateIndex
CREATE INDEX "promo_vouchers_isEnabled_startsAt_endsAt_idx" ON "promo_vouchers"("isEnabled", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "promo_voucher_redemptions_orderId_key" ON "promo_voucher_redemptions"("orderId");

-- CreateIndex
CREATE INDEX "promo_voucher_redemptions_voucherId_status_idx" ON "promo_voucher_redemptions"("voucherId", "status");

-- CreateIndex
CREATE INDEX "promo_voucher_redemptions_memberId_voucherId_idx" ON "promo_voucher_redemptions"("memberId", "voucherId");

-- CreateIndex
CREATE INDEX "promo_voucher_redemptions_guestKey_voucherId_idx" ON "promo_voucher_redemptions"("guestKey", "voucherId");

-- CreateIndex
CREATE INDEX "product_providers_productId_idx" ON "product_providers"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_providers_productId_providerId_key" ON "product_providers"("productId", "providerId");

-- CreateIndex
CREATE INDEX "banners_isActive_sortOrder_idx" ON "banners"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "site_popups_isActive_sortOrder_idx" ON "site_popups"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ticker_items_isActive_sortOrder_idx" ON "ticker_items"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");

-- CreateIndex
CREATE INDEX "content_pages_isActive_showInFooter_sortOrder_idx" ON "content_pages"("isActive", "showInFooter", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_isActive_publishedAt_idx" ON "articles"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "expenses_category_date_idx" ON "expenses"("category", "date");

-- CreateIndex
CREATE UNIQUE INDEX "members_memberCode_key" ON "members"("memberCode");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_whatsapp_key" ON "members"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "members_googleId_key" ON "members"("googleId");

-- CreateIndex
CREATE INDEX "members_isActive_idx" ON "members"("isActive");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "member_balances_memberId_key" ON "member_balances"("memberId");

-- CreateIndex
CREATE INDEX "member_ledger_entries_memberId_createdAt_idx" ON "member_ledger_entries"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "member_ledger_entries_kind_createdAt_idx" ON "member_ledger_entries"("kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "member_deposits_depositCode_key" ON "member_deposits"("depositCode");

-- CreateIndex
CREATE INDEX "member_deposits_memberId_createdAt_idx" ON "member_deposits"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "member_deposits_paymentStatus_createdAt_idx" ON "member_deposits"("paymentStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "member_email_tokens_tokenHash_key" ON "member_email_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "member_email_tokens_memberId_type_idx" ON "member_email_tokens"("memberId", "type");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_templateKey_entityType_entityId_key" ON "email_logs"("templateKey", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderCode_key" ON "orders"("orderCode");

-- CreateIndex
CREATE INDEX "orders_email_idx" ON "orders"("email");

-- CreateIndex
CREATE INDEX "orders_whatsapp_idx" ON "orders"("whatsapp");

-- CreateIndex
CREATE INDEX "orders_playerLabel_idx" ON "orders"("playerLabel");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_createdAt_idx" ON "orders"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "orders_fulfillmentStatus_paymentStatus_idx" ON "orders"("fulfillmentStatus", "paymentStatus");

-- CreateIndex
CREATE INDEX "orders_providerRefId_idx" ON "orders"("providerRefId");

-- CreateIndex
CREATE INDEX "orders_memberId_createdAt_idx" ON "orders"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_productId_idx" ON "orders"("productId");

-- CreateIndex
CREATE INDEX "orders_productSkuId_idx" ON "orders"("productSkuId");

-- CreateIndex
CREATE INDEX "fulfillment_logs_orderId_createdAt_idx" ON "fulfillment_logs"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "fulfillment_logs_providerRef_idx" ON "fulfillment_logs"("providerRef");

-- CreateIndex
CREATE INDEX "fulfillment_logs_providerSlug_createdAt_idx" ON "fulfillment_logs"("providerSlug", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_memberDepositId_idx" ON "payments"("memberDepositId");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateways_slug_key" ON "payment_gateways"("slug");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "fulfillment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_items" ADD CONSTRAINT "flash_sale_items_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "flash_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_items" ADD CONSTRAINT "flash_sale_items_productSkuId_fkey" FOREIGN KEY ("productSkuId") REFERENCES "product_skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_voucher_redemptions" ADD CONSTRAINT "promo_voucher_redemptions_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "promo_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_voucher_redemptions" ADD CONSTRAINT "promo_voucher_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_voucher_redemptions" ADD CONSTRAINT "promo_voucher_redemptions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_providers" ADD CONSTRAINT "product_providers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_providers" ADD CONSTRAINT "product_providers_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "fulfillment_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_balances" ADD CONSTRAINT "member_balances_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_ledger_entries" ADD CONSTRAINT "member_ledger_entries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_deposits" ADD CONSTRAINT "member_deposits_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_email_tokens" ADD CONSTRAINT "member_email_tokens_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productSkuId_fkey" FOREIGN KEY ("productSkuId") REFERENCES "product_skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_wallets" ADD CONSTRAINT "order_wallets_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_logs" ADD CONSTRAINT "fulfillment_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_memberDepositId_fkey" FOREIGN KEY ("memberDepositId") REFERENCES "member_deposits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
