import { BrandLogo } from "@/components/site/brand-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/console/login-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ConsoleLoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { isActive: true },
    });

    if (admin?.isActive) {
      redirect("/console");
    }

    redirect("/console/clear-session");
  }

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-neon/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-neon/5 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-vignette opacity-60" />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
          <Link href="/" className="inline-block w-fit">
            <BrandLogo
              alt="R9host"
              className="!w-64"
              priority
            />
          </Link>

          <div className="mt-14 max-w-md">
            <p className="font-display text-[11px] font-bold tracking-[0.32em] uppercase text-neon">
              Operations Center
            </p>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-chrome xl:text-4xl">
              Kelola toko top-up
              <span className="mt-1 block text-neon">dari satu panel.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-chrome-dim">
              Pantau order, atur katalog game, dan kelola operasional harian dengan aman.
            </p>
          </div>

          <ul className="mt-10 space-y-3 text-sm text-chrome-dim">
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
              Katalog &amp; harga terpusat
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
              Monitoring transaksi real-time
            </li>
            <li className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
              Akses aman untuk tim operasional
            </li>
          </ul>
        </div>

        <div className="relative z-10 border-t border-line/80 px-12 py-6 xl:px-16">
          <p className="text-xs text-chrome-dim">
            © {new Date().getFullYear()} R9host · Panel operasional internal
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-25 lg:opacity-15" />
        <div className="pointer-events-none absolute inset-0 bg-vignette opacity-40 lg:opacity-20" />

        <div className="relative z-10 mx-auto w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-block">
              <BrandLogo
                alt="R9host"
                className="!w-52"
                priority
              />
            </Link>
          </div>

          <div className="mb-8">
            <p className="font-display text-[11px] font-bold tracking-[0.28em] uppercase text-neon">
              Masuk
            </p>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-[var(--console-text-strong)] sm:text-3xl">
              Panel Operasional
            </h2>
            <p className="mt-2 text-sm leading-relaxed console-text-muted">
              Gunakan email dan password yang telah diberikan untuk mengakses dashboard.
            </p>
          </div>

          <div className="console-panel p-6 sm:p-8">
            <LoginForm />
          </div>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-chrome-dim/80">
            Jika mengalami kendala akses, hubungi administrator sistem Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
