import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Prisma, ProductSkuStatus, ProductStatus } from "../app/generated/prisma/client";
import {
  gameInputFieldPresets,
  hasZoneField,
  type GameInputFieldsConfig,
} from "../lib/catalog-products/game-input-fields";
import { createPrismaClient } from "../lib/prisma";
import { getProviderDocsUrl, providerDefaultApiUrls } from "../lib/providers/provider-api-urls";

const categorySeeds = [
  { id: "cat_game", slug: "game", name: "Topup Game", sortOrder: 1 },
  { id: "cat_app", slug: "app", name: "App Premium", sortOrder: 2 },
  { id: "cat_pulsa", slug: "pulsa", name: "Pulsa & Data", sortOrder: 3 },
  { id: "cat_voucher", slug: "voucher", name: "Voucher", sortOrder: 4 },
  { id: "cat_emoney", slug: "e-money", name: "E-Money", sortOrder: 5 },
] as const;

const providerSeeds = [
  {
    id: "fp_digiflazz",
    slug: "digiflazz",
    name: "Digiflazz",
    description: null as string | null,
    sortOrder: 1,
    supportsCatalogSync: true,
    config: { apiUrl: providerDefaultApiUrls.digiflazz.production },
    docsUrl: getProviderDocsUrl("digiflazz"),
  },
  {
    id: "fp_melostore",
    slug: "melostore",
    name: "Melostore H2H",
    description:
      "H2H katalog lebar (game, voucher global, streaming). Auth: X-API-Key + X-Secret-Key. Webhook async: X-H2H-Signature (HMAC-SHA256, Webhook Secret terpisah). Production wajib IP whitelist.",
    sortOrder: 2,
    supportsCatalogSync: true,
    config: { apiUrl: providerDefaultApiUrls.melostore.production },
    docsUrl: getProviderDocsUrl("melostore"),
  },
  {
    id: "fp_apigames",
    slug: "apigames",
    name: "API Games",
    description: null,
    sortOrder: 3,
    supportsCatalogSync: false,
    config: { apiUrl: providerDefaultApiUrls.apigames.production },
    docsUrl: getProviderDocsUrl("apigames"),
  },
  {
    id: "fp_iak",
    slug: "iak",
    name: "IAK",
    description: null,
    sortOrder: 4,
    supportsCatalogSync: true,
    config: { apiUrl: providerDefaultApiUrls.iak.production },
    docsUrl: getProviderDocsUrl("iak"),
  },
  {
    id: "fp_manual",
    slug: "manual",
    name: "Manual",
    description: null,
    sortOrder: 5,
    supportsCatalogSync: false,
    config: {},
    docsUrl: null,
  },
] as const;

const riotIdFields: GameInputFieldsConfig = {
  fields: [
    {
      key: "userId",
      label: "Riot ID",
      type: "text",
      placeholder: "Nama#TAG",
      required: true,
    },
  ],
};

const usernameFields = (label: string, placeholder: string): GameInputFieldsConfig => ({
  fields: [
    {
      key: "userId",
      label,
      type: "text",
      placeholder,
      required: true,
    },
  ],
});

type SkuSeed = {
  code: string;
  name: string;
  typeSlug: string;
  costPrice: number;
  priceGuest: number;
  priceMember: number;
};

type GameSeed = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  initials: string;
  from: string;
  to: string;
  isPopular: boolean;
  soldCount: number;
  sortOrder: number;
  inputFields: GameInputFieldsConfig;
  types: { slug: string; name: string }[];
  skus: SkuSeed[];
};

function diamondSkus(
  packs: { code: string; name: string; guest: number; member?: number }[],
  typeSlug = "diamond",
): SkuSeed[] {
  return packs.map((pack) => ({
    code: pack.code,
    name: pack.name,
    typeSlug,
    costPrice: Math.round(pack.guest * 0.88),
    priceGuest: pack.guest,
    priceMember: pack.member ?? Math.round(pack.guest * 0.97),
  }));
}

const gameSeeds: GameSeed[] = [
  {
    id: "prod_mobile-legends",
    slug: "mobile-legends",
    name: "Mobile Legends",
    subtitle: "Diamond & Weekly Pass server Indonesia",
    initials: "ML",
    from: "#14240a",
    to: "#0b1206",
    isPopular: true,
    soldCount: 12840,
    sortOrder: 1,
    inputFields: gameInputFieldPresets.userIdAndZone,
    types: [
      { slug: "diamond", name: "Diamond" },
      { slug: "pass", name: "Pass" },
    ],
    skus: [
      ...diamondSkus([
        { code: "86", name: "86 Diamonds", guest: 20000 },
        { code: "172", name: "172 Diamonds", guest: 40000 },
        { code: "257", name: "257 Diamonds", guest: 60000 },
        { code: "344", name: "344 Diamonds", guest: 80000 },
        { code: "706", name: "706 Diamonds", guest: 160000 },
      ]),
      ...diamondSkus(
        [
          { code: "weekly", name: "Weekly Diamond Pass", guest: 28000 },
          { code: "twilight", name: "Twilight Pass", guest: 140000 },
        ],
        "pass",
      ),
    ],
  },
  {
    id: "prod_free-fire",
    slug: "free-fire",
    name: "Free Fire",
    subtitle: "Diamond & membership Garena Indonesia",
    initials: "FF",
    from: "#2a1608",
    to: "#120a04",
    isPopular: true,
    soldCount: 11220,
    sortOrder: 2,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [
      { slug: "diamond", name: "Diamond" },
      { slug: "pass", name: "Membership" },
    ],
    skus: [
      ...diamondSkus([
        { code: "70", name: "70 Diamonds", guest: 10000 },
        { code: "140", name: "140 Diamonds", guest: 20000 },
        { code: "355", name: "355 Diamonds", guest: 50000 },
        { code: "720", name: "720 Diamonds", guest: 100000 },
      ]),
      ...diamondSkus([{ code: "member", name: "Member Mingguan", guest: 30000 }], "pass"),
    ],
  },
  {
    id: "prod_pubg-mobile",
    slug: "pubg-mobile",
    name: "PUBG Mobile",
    subtitle: "UC server Indonesia",
    initials: "PUBG",
    from: "#24180a",
    to: "#0e0a04",
    isPopular: true,
    soldCount: 7640,
    sortOrder: 3,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "uc", name: "UC" }],
    skus: diamondSkus(
      [
        { code: "60", name: "60 UC", guest: 15000 },
        { code: "325", name: "325 UC", guest: 75000 },
        { code: "660", name: "660 UC", guest: 150000 },
        { code: "1800", name: "1800 UC", guest: 375000 },
      ],
      "uc",
    ),
  },
  {
    id: "prod_honor-of-kings",
    slug: "honor-of-kings",
    name: "Honor of Kings",
    subtitle: "Tokens server Indonesia",
    initials: "HOK",
    from: "#1a1230",
    to: "#0a0818",
    isPopular: true,
    soldCount: 5310,
    sortOrder: 4,
    inputFields: gameInputFieldPresets.userIdAndZone,
    types: [{ slug: "token", name: "Tokens" }],
    skus: diamondSkus(
      [
        { code: "16", name: "16 Tokens", guest: 5000 },
        { code: "80", name: "80 Tokens", guest: 22000 },
        { code: "240", name: "240 Tokens", guest: 65000 },
        { code: "400", name: "400 Tokens", guest: 105000 },
      ],
      "token",
    ),
  },
  {
    id: "prod_higgs-domino",
    slug: "higgs-domino",
    name: "Higgs Domino",
    subtitle: "Chip & gold island Indonesia",
    initials: "HD",
    from: "#301408",
    to: "#140804",
    isPopular: true,
    soldCount: 9890,
    sortOrder: 5,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [
      { slug: "chip", name: "Chip" },
      { slug: "gold", name: "Gold" },
    ],
    skus: [
      ...diamondSkus(
        [
          { code: "b-chip", name: "B Chip", guest: 12000 },
          { code: "m-chip", name: "M Chip", guest: 55000 },
          { code: "l-chip", name: "L Chip", guest: 100000 },
        ],
        "chip",
      ),
      ...diamondSkus([{ code: "gold", name: "Gold Paket", guest: 25000 }], "gold"),
    ],
  },
  {
    id: "prod_genshin-impact",
    slug: "genshin-impact",
    name: "Genshin Impact",
    subtitle: "Genesis Crystal server Asia",
    initials: "GI",
    from: "#0c2430",
    to: "#061018",
    isPopular: true,
    soldCount: 4180,
    sortOrder: 6,
    inputFields: gameInputFieldPresets.userIdAndServer,
    types: [
      { slug: "crystal", name: "Genesis Crystal" },
      { slug: "pass", name: "Blessing" },
    ],
    skus: [
      ...diamondSkus(
        [
          { code: "60", name: "60 Genesis Crystal", guest: 16000 },
          { code: "300", name: "300 Genesis Crystal", guest: 79000 },
          { code: "980", name: "980 Genesis Crystal", guest: 249000 },
        ],
        "crystal",
      ),
      ...diamondSkus([{ code: "welkin", name: "Blessing of the Welkin Moon", guest: 79000 }], "pass"),
    ],
  },
  {
    id: "prod_honkai-star-rail",
    slug: "honkai-star-rail",
    name: "Honkai: Star Rail",
    subtitle: "Oneiric Shard server Asia",
    initials: "HSR",
    from: "#201028",
    to: "#100814",
    isPopular: false,
    soldCount: 2210,
    sortOrder: 7,
    inputFields: gameInputFieldPresets.userIdAndServer,
    types: [{ slug: "shard", name: "Oneiric Shard" }],
    skus: diamondSkus(
      [
        { code: "60", name: "60 Oneiric Shard", guest: 16000 },
        { code: "330", name: "330 Oneiric Shard", guest: 79000 },
        { code: "1090", name: "1090 Oneiric Shard", guest: 249000 },
      ],
      "shard",
    ),
  },
  {
    id: "prod_valorant",
    slug: "valorant",
    name: "Valorant",
    subtitle: "Points region Indonesia",
    initials: "VAL",
    from: "#28080c",
    to: "#120406",
    isPopular: true,
    soldCount: 3650,
    sortOrder: 8,
    inputFields: riotIdFields,
    types: [{ slug: "vp", name: "Valorant Points" }],
    skus: diamondSkus(
      [
        { code: "475", name: "475 VP", guest: 50000 },
        { code: "1000", name: "1000 VP", guest: 100000 },
        { code: "2050", name: "2050 VP", guest: 200000 },
        { code: "3650", name: "3650 VP", guest: 350000 },
      ],
      "vp",
    ),
  },
  {
    id: "prod_roblox",
    slug: "roblox",
    name: "Roblox",
    subtitle: "Robux untuk akun Indonesia",
    initials: "RBX",
    from: "#1a1a1a",
    to: "#0a0a0a",
    isPopular: true,
    soldCount: 6020,
    sortOrder: 9,
    inputFields: usernameFields("Username Roblox", "username"),
    types: [{ slug: "robux", name: "Robux" }],
    skus: diamondSkus(
      [
        { code: "80", name: "80 Robux", guest: 18000 },
        { code: "400", name: "400 Robux", guest: 85000 },
        { code: "800", name: "800 Robux", guest: 165000 },
        { code: "1700", name: "1700 Robux", guest: 330000 },
      ],
      "robux",
    ),
  },
  {
    id: "prod_cod-mobile",
    slug: "call-of-duty-mobile",
    name: "Call of Duty Mobile",
    subtitle: "CP server Indonesia",
    initials: "COD",
    from: "#18200c",
    to: "#0a1006",
    isPopular: false,
    soldCount: 1980,
    sortOrder: 10,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "cp", name: "CP" }],
    skus: diamondSkus(
      [
        { code: "80", name: "80 CP", guest: 16000 },
        { code: "420", name: "420 CP", guest: 79000 },
        { code: "880", name: "880 CP", guest: 159000 },
      ],
      "cp",
    ),
  },
  {
    id: "prod_magic-chess",
    slug: "magic-chess",
    name: "Magic Chess",
    subtitle: "Diamond MLBB Chess Indonesia",
    initials: "MC",
    from: "#102018",
    to: "#08100c",
    isPopular: false,
    soldCount: 1540,
    sortOrder: 11,
    inputFields: gameInputFieldPresets.userIdAndZone,
    types: [{ slug: "diamond", name: "Diamond" }],
    skus: diamondSkus([
      { code: "86", name: "86 Diamonds", guest: 20000 },
      { code: "172", name: "172 Diamonds", guest: 40000 },
      { code: "344", name: "344 Diamonds", guest: 80000 },
    ]),
  },
  {
    id: "prod_growtopia",
    slug: "growtopia",
    name: "Growtopia",
    subtitle: "Gems akun Indonesia",
    initials: "GT",
    from: "#143018",
    to: "#08140c",
    isPopular: false,
    soldCount: 2760,
    sortOrder: 12,
    inputFields: usernameFields("GrowID", "growid"),
    types: [{ slug: "gems", name: "Gems" }],
    skus: diamondSkus(
      [
        { code: "20k", name: "20.000 Gems", guest: 25000 },
        { code: "50k", name: "50.000 Gems", guest: 55000 },
        { code: "100k", name: "100.000 Gems", guest: 100000 },
      ],
      "gems",
    ),
  },
  {
    id: "prod_stumble-guys",
    slug: "stumble-guys",
    name: "Stumble Guys",
    subtitle: "Gems & stumble pass",
    initials: "SG",
    from: "#301828",
    to: "#140c14",
    isPopular: false,
    soldCount: 1320,
    sortOrder: 13,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "gems", name: "Gems" }],
    skus: diamondSkus(
      [
        { code: "250", name: "250 Gems", guest: 15000 },
        { code: "800", name: "800 Gems", guest: 45000 },
        { code: "1500", name: "1500 Gems", guest: 80000 },
      ],
      "gems",
    ),
  },
  {
    id: "prod_super-sus",
    slug: "super-sus",
    name: "Super Sus",
    subtitle: "Gold server Indonesia",
    initials: "SS",
    from: "#082030",
    to: "#041018",
    isPopular: false,
    soldCount: 980,
    sortOrder: 14,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "gold", name: "Gold" }],
    skus: diamondSkus(
      [
        { code: "100", name: "100 Gold", guest: 12000 },
        { code: "310", name: "310 Gold", guest: 35000 },
        { code: "520", name: "520 Gold", guest: 55000 },
      ],
      "gold",
    ),
  },
  {
    id: "prod_fc-mobile",
    slug: "fc-mobile",
    name: "FC Mobile",
    subtitle: "FC Points Indonesia",
    initials: "FC",
    from: "#082418",
    to: "#04120c",
    isPopular: false,
    soldCount: 1670,
    sortOrder: 15,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "points", name: "FC Points" }],
    skus: diamondSkus(
      [
        { code: "40", name: "40 FC Points", guest: 12000 },
        { code: "100", name: "100 FC Points", guest: 28000 },
        { code: "520", name: "520 FC Points", guest: 135000 },
      ],
      "points",
    ),
  },
  {
    id: "prod_wild-rift",
    slug: "wild-rift",
    name: "Wild Rift",
    subtitle: "Wild Cores server Indonesia",
    initials: "WR",
    from: "#101828",
    to: "#080c14",
    isPopular: false,
    soldCount: 1110,
    sortOrder: 16,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "cores", name: "Wild Cores" }],
    skus: diamondSkus(
      [
        { code: "425", name: "425 Wild Cores", guest: 50000 },
        { code: "1000", name: "1000 Wild Cores", guest: 110000 },
        { code: "1850", name: "1850 Wild Cores", guest: 200000 },
      ],
      "cores",
    ),
  },
  {
    id: "prod_blood-strike",
    slug: "blood-strike",
    name: "Blood Strike",
    subtitle: "Gold server Indonesia",
    initials: "BS",
    from: "#280c0c",
    to: "#140606",
    isPopular: false,
    soldCount: 890,
    sortOrder: 17,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "gold", name: "Gold" }],
    skus: diamondSkus(
      [
        { code: "100", name: "100 Gold", guest: 15000 },
        { code: "310", name: "310 Gold", guest: 45000 },
        { code: "570", name: "570 Gold", guest: 80000 },
      ],
      "gold",
    ),
  },
  {
    id: "prod_zenless-zone-zero",
    slug: "zenless-zone-zero",
    name: "Zenless Zone Zero",
    subtitle: "Monochrome server Asia",
    initials: "ZZZ",
    from: "#201810",
    to: "#100c08",
    isPopular: false,
    soldCount: 740,
    sortOrder: 18,
    inputFields: gameInputFieldPresets.userIdAndServer,
    types: [{ slug: "mono", name: "Monochrome" }],
    skus: diamondSkus(
      [
        { code: "60", name: "60 Monochrome", guest: 16000 },
        { code: "300", name: "300 Monochrome", guest: 79000 },
        { code: "980", name: "980 Monochrome", guest: 249000 },
      ],
      "mono",
    ),
  },
  {
    id: "prod_wuthering-waves",
    slug: "wuthering-waves",
    name: "Wuthering Waves",
    subtitle: "Lunite server Asia / SEA",
    initials: "WUWA",
    from: "#102428",
    to: "#081214",
    isPopular: false,
    soldCount: 680,
    sortOrder: 19,
    inputFields: gameInputFieldPresets.userIdAndServer,
    types: [{ slug: "lunite", name: "Lunite" }],
    skus: diamondSkus(
      [
        { code: "60", name: "60 Lunite", guest: 16000 },
        { code: "300", name: "300 Lunite", guest: 79000 },
        { code: "980", name: "980 Lunite", guest: 249000 },
      ],
      "lunite",
    ),
  },
  {
    id: "prod_efootball",
    slug: "efootball",
    name: "eFootball",
    subtitle: "Coins akun Indonesia",
    initials: "eF",
    from: "#082010",
    to: "#041008",
    isPopular: false,
    soldCount: 560,
    sortOrder: 20,
    inputFields: gameInputFieldPresets.userIdOnly,
    types: [{ slug: "coins", name: "Coins" }],
    skus: diamondSkus(
      [
        { code: "100", name: "100 Coins", guest: 18000 },
        { code: "550", name: "550 Coins", guest: 90000 },
        { code: "1300", name: "1300 Coins", guest: 200000 },
      ],
      "coins",
    ),
  },
];

function resolveGameThumbnail(slug: string) {
  const dir = path.join(process.cwd(), "public", "games");
  for (const ext of ["jpg", "jpeg", "png", "webp"] as const) {
    if (fs.existsSync(path.join(dir, `${slug}.${ext}`))) {
      return `/games/${slug}.${ext}`;
    }
  }
  return `/games/${slug}.svg`;
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function writeGameTile(game: GameSeed) {
  const dir = path.join(process.cwd(), "public", "games");
  fs.mkdirSync(dir, { recursive: true });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" role="img" aria-label="${xmlEscape(game.name)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${game.from}"/>
      <stop offset="100%" stop-color="${game.to}"/>
    </linearGradient>
  </defs>
  <rect width="360" height="480" fill="url(#bg)"/>
  <rect x="14" y="14" width="332" height="452" fill="none" stroke="#ff7a1a" stroke-opacity="0.4" stroke-width="2"/>
  <circle cx="180" cy="188" r="72" fill="#ff7a1a" fill-opacity="0.08"/>
  <text x="180" y="204" text-anchor="middle" fill="#ffd4a8" font-family="Arial Black, Arial, sans-serif" font-size="${game.initials.length > 3 ? 42 : 64}" font-weight="800">${xmlEscape(game.initials)}</text>
  <text x="180" y="320" text-anchor="middle" fill="#f4ffe0" font-family="Arial, sans-serif" font-size="20" font-weight="700">${xmlEscape(game.name)}</text>
  <text x="180" y="350" text-anchor="middle" fill="#ff7a1a" font-family="Arial, sans-serif" font-size="12" font-weight="600">SERVER INDONESIA</text>
</svg>
`;
  fs.writeFileSync(path.join(dir, `${game.slug}.svg`), svg);
}

async function main() {
  const prisma = createPrismaClient();

  for (const item of categorySeeds) {
    await prisma.category.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  for (const item of providerSeeds) {
    await prisma.fulfillmentProvider.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        docsUrl: item.docsUrl,
      },
      create: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
        supportsCatalogSync: item.supportsCatalogSync,
        config: item.config,
        docsUrl: item.docsUrl,
      },
    });
  }

  const gameCategory = await prisma.category.findUnique({ where: { slug: "game" } });
  if (!gameCategory) {
    throw new Error("Kategori game belum ada.");
  }

  const manualProvider = await prisma.fulfillmentProvider.findUnique({
    where: { slug: "manual" },
  });
  if (!manualProvider) {
    throw new Error("Provider manual belum ada.");
  }

  for (const game of gameSeeds) {
    writeGameTile(game);
    const thumbnailUrl = resolveGameThumbnail(game.slug);
    const inputFields = game.inputFields as Prisma.InputJsonValue;

    const product = await prisma.product.upsert({
      where: { slug: game.slug },
      update: {
        name: game.name,
        subtitle: game.subtitle,
        categoryId: gameCategory.id,
        isPopular: game.isPopular,
        soldCount: game.soldCount,
        status: ProductStatus.ACTIVE,
        thumbnailUrl,
        requiresZone: hasZoneField(game.inputFields),
        inputFields,
        sortOrder: game.sortOrder,
      },
      create: {
        id: game.id,
        slug: game.slug,
        name: game.name,
        subtitle: game.subtitle,
        categoryId: gameCategory.id,
        isPopular: game.isPopular,
        soldCount: game.soldCount,
        status: ProductStatus.ACTIVE,
        thumbnailUrl,
        requiresZone: hasZoneField(game.inputFields),
        inputFields,
        sortOrder: game.sortOrder,
      },
    });

    const typeIds = new Map<string, string>();
    for (const [index, type] of game.types.entries()) {
      const row = await prisma.productType.upsert({
        where: {
          productId_slug: { productId: product.id, slug: type.slug },
        },
        update: { name: type.name, sortOrder: index },
        create: {
          productId: product.id,
          slug: type.slug,
          name: type.name,
          sortOrder: index,
        },
      });
      typeIds.set(type.slug, row.id);
    }

    for (const sku of game.skus) {
      const productTypeId = typeIds.get(sku.typeSlug);
      if (!productTypeId) {
        throw new Error(`Jenis ${sku.typeSlug} tidak ada untuk ${game.slug}`);
      }

      await prisma.productSku.upsert({
        where: {
          productId_providerId_providerSku: {
            productId: product.id,
            providerId: manualProvider.id,
            providerSku: `ID-${game.slug}-${sku.code}`,
          },
        },
        update: {
          name: sku.name,
          productTypeId,
          costPrice: sku.costPrice,
          marginGuest: sku.priceGuest - sku.costPrice,
          marginMember: sku.priceMember - sku.costPrice,
          priceGuest: sku.priceGuest,
          priceMember: sku.priceMember,
          status: ProductSkuStatus.AVAILABLE,
          providerCatalogBrand: `${game.name} (ID)`,
          note: "Seed katalog Indonesia",
        },
        create: {
          productId: product.id,
          productTypeId,
          name: sku.name,
          providerId: manualProvider.id,
          providerSku: `ID-${game.slug}-${sku.code}`,
          costPrice: sku.costPrice,
          marginGuest: sku.priceGuest - sku.costPrice,
          marginMember: sku.priceMember - sku.costPrice,
          priceGuest: sku.priceGuest,
          priceMember: sku.priceMember,
          status: ProductSkuStatus.AVAILABLE,
          providerCatalogBrand: `${game.name} (ID)`,
          note: "Seed katalog Indonesia",
        },
      });
    }
  }

  const [categoryCount, providerCount, productCount, skuCount] = await Promise.all([
    prisma.category.count(),
    prisma.fulfillmentProvider.count(),
    prisma.product.count(),
    prisma.productSku.count(),
  ]);

  await prisma.$disconnect();

  console.log(
    `Seed selesai: ${categoryCount} kategori, ${providerCount} provider, ${productCount} game, ${skuCount} SKU.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
