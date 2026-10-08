import Link from "next/link";
import type { SeoEntityReport } from "@/lib/seo/get-seo-report";
import type { SeoFlagSeverity } from "@/lib/seo/seo-rules";

type SeoEntityTableProps = {
  entities: SeoEntityReport[];
  emptyLabel: string;
};

const SEVERITY_LABEL: Record<SeoFlagSeverity, string> = {
  ok: "OK",
  warn: "Peringatan",
  fail: "Gagal",
};

function severityBadgeClass(severity: SeoFlagSeverity): string {
  if (severity === "fail") return "console-badge console-badge--danger";
  if (severity === "warn") return "console-badge console-badge--warning";
  return "console-badge console-badge--success";
}

export function SeoEntityTable({ entities, emptyLabel }: SeoEntityTableProps) {
  if (entities.length === 0) {
    return (
      <div className="console-panel console-panel--padded">
        <p className="console-seo-entity__empty">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="console-panel">
      <div className="console-table-wrap">
        <table className="console-table console-table--seo">
          <thead>
            <tr>
              <th className="console-table--seo__name">Nama</th>
              <th className="console-table--seo__url">URL</th>
              <th className="console-table--seo__status">Status</th>
              <th className="console-table--seo__findings">Temuan</th>
              <th className="console-table--seo__actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => {
              const issues = entity.flags.filter((f) => f.severity !== "ok");
              return (
                <tr key={`${entity.kind}-${entity.id}`}>
                  <td className="console-table--seo__name">
                    <p className="console-seo-entity__name">{entity.name}</p>
                    <p className="console-seo-entity__meta" title={entity.title}>
                      {entity.title}
                    </p>
                  </td>
                  <td className="console-table--seo__url">
                    <code className="console-seo-entity__path">{entity.path}</code>
                  </td>
                  <td className="console-table--seo__status">
                    <span className={severityBadgeClass(entity.severity)}>
                      {SEVERITY_LABEL[entity.severity]}
                    </span>
                  </td>
                  <td className="console-table--seo__findings">
                    {issues.length === 0 ? (
                      <span className="console-seo-entity__ok">Tidak ada masalah</span>
                    ) : (
                      <ul className="console-seo-entity__flags">
                        {issues.slice(0, 3).map((flag) => (
                          <li key={flag.code}>{flag.message}</li>
                        ))}
                        {issues.length > 3 ? (
                          <li className="console-seo-entity__more">+{issues.length - 3} lainnya</li>
                        ) : null}
                      </ul>
                    )}
                  </td>
                  <td className="console-table--seo__actions">
                    <div className="console-seo-entity__actions">
                      {entity.editHref ? (
                        <Link href={entity.editHref} className="console-seo-entity__action">
                          Edit
                        </Link>
                      ) : null}
                      <a
                        href={entity.viewHref}
                        target="_blank"
                        rel="noreferrer"
                        className="console-seo-entity__action"
                      >
                        Lihat
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
