export type DummyGame = {
  slug: string;
  name: string;
  tag: string;
  accent: string;
  logo: string;
};

export const dummyGames: DummyGame[] = [
  {
    slug: "mobile-legends",
    name: "Mobile Legends",
    tag: "MOBA",
    accent: "#ff7a1a",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/MLBB-2025-tiles-178x178.jpg",
  },
  {
    slug: "free-fire",
    name: "Free Fire",
    tag: "Battle",
    accent: "#ffd4a8",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/free-fire-tile-codacash-new.jpg",
  },
  {
    slug: "genshin",
    name: "Genshin Impact",
    tag: "RPG",
    accent: "#9dff4a",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/genshinimpact_tile.jpg",
  },
  {
    slug: "valorant",
    name: "Valorant",
    tag: "FPS",
    accent: "#c8ff66",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/valorant_tile.jpg",
  },
  {
    slug: "pubg",
    name: "PUBG Mobile",
    tag: "Battle",
    accent: "#a8e000",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/pubgm_tile_aug2024.jpg",
  },
  {
    slug: "hok",
    name: "Honor of Kings",
    tag: "MOBA",
    accent: "#d4ff3f",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/HonorofKings_Codacash178x178.jpg",
  },
  {
    slug: "roblox",
    name: "Roblox",
    tag: "Sandbox",
    accent: "#ff7a1a",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/Roblox-Gift-Cards-tile.png",
  },
  {
    slug: "steam",
    name: "Steam Wallet",
    tag: "PC",
    accent: "#e24e00",
    logo: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/steam_tile.jpg",
  },
];
