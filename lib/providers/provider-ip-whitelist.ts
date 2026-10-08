export type ProviderIpWhitelistEntry = {
  label: string;
  ip: string;
  hint: string;
};

export type ProviderIpWhitelistGuide = {
  steps: string[];
  dashboardUrl?: string;
  dashboardLabel?: string;
  sandboxNote?: string;
  providerSideIps?: ProviderIpWhitelistEntry[];
};

const guides: Record<string, ProviderIpWhitelistGuide> = {
  digiflazz: {
    steps: [
      "Buka Pengaturan Koneksi API di dashboard member Digiflazz.",
      "Salin IP server di bawah ke kolom Production IP (mode live) atau Development IP (mode testing).",
      "Simpan. Error \"IP Anda tidak kami kenali\" berarti IP ini belum didaftarkan di Digiflazz.",
    ],
    dashboardUrl: "https://member.digiflazz.com/buyer-area/connection",
    dashboardLabel: "Pengaturan Koneksi API Digiflazz",
    sandboxNote:
      "Mode sandbox/testing: IP whitelist tidak wajib. Production/live wajib daftarkan IP server.",
    providerSideIps: [
      {
        label: "IP Digiflazz (callback)",
        ip: "52.74.250.133",
        hint: "Whitelist IP ini di firewall/server jika webhook/callback dari Digiflazz diblokir (docs: developer.digiflazz.com).",
      },
    ],
  },
  melostore: {
    steps: [
      "Buka dashboard partner Melostore → Developer / Kredensial.",
      "Daftarkan IP server di pengaturan IP whitelist (production).",
      "Salin IP di bawah ke daftar IP yang diizinkan.",
    ],
    dashboardUrl: "https://h2h.melostore.id/id/docs",
    dashboardLabel: "Docs Melostore H2H",
    sandboxNote: "Sandbox default tidak wajib IP whitelist. Production wajib.",
  },
  iak: {
    steps: [
      "Login portal IAK (developer.iak.id).",
      "Buka Pengaturan API → whitelist IP server untuk Production API key.",
      "Salin IP di bawah. Sandbox (prepaid.iak.dev) tidak wajib whitelist.",
    ],
    dashboardUrl: "https://developer.iak.id",
    dashboardLabel: "Portal Developer IAK",
    sandboxNote: "Sandbox: Development API key + prepaid.iak.dev — whitelist IP tidak wajib.",
  },
};

export function getProviderIpWhitelistGuide(slug: string): ProviderIpWhitelistGuide | null {
  return guides[slug] ?? null;
}

export function providerSupportsIpWhitelist(slug: string): boolean {
  return slug in guides;
}
