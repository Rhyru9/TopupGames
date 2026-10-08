import { NeonLoadingCircle } from "@/components/nav/navigation-progress";

/** Backup saat Suspense page — circle sama seperti navigasi. */
export default function ConsolePanelLoading() {
  return (
    <div className="console-route-loading" aria-busy="true" aria-live="polite">
      <NeonLoadingCircle />
    </div>
  );
}
