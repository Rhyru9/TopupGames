import ExcelJS from "exceljs";
import { listExpenses } from "@/lib/reports/get-expense-mutations";
import { getReportIncomeRows } from "@/lib/reports/get-report-income";
import { getReportDailySeries } from "@/lib/reports/get-report-series";
import { getReportSummary } from "@/lib/reports/get-report-summary";
import { calcReportDelta, resolvePreviousPeriod } from "@/lib/reports/report-compare";
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategoryValue } from "@/lib/reports/expense-labels";
import { formatReportDate, formatReportDateTime, formatReportRupiah } from "@/lib/reports/report-format";
import type { ReportPeriod } from "@/lib/reports/report-period";

const COLORS = {
  titleBg: "1F2937",
  titleFg: "FFFFFF",
  headerBg: "F3F4F6",
  headerFg: "111827",
  accentLine: "9CA3AF",
  zebra: "F9FAFB",
  border: "E5E7EB",
  muted: "6B7280",
  text: "111827",
  money: "111827",
  positive: "047857",
  danger: "B91C1C",
  white: "FFFFFF",
};

const MONEY_FMT = '"Rp"* #,##0';
const PCT_FMT = '0.0"%"';

function styleTitle(cell: ExcelJS.Cell) {
  cell.font = { name: "Calibri", size: 16, bold: true, color: { argb: COLORS.titleFg } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.titleBg },
  };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

function styleSubtitle(cell: ExcelJS.Cell) {
  cell.font = { name: "Calibri", size: 11, color: { argb: COLORS.muted } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.white },
  };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

function styleHeaderRow(row: ExcelJS.Row, columnCount: number) {
  row.height = 22;
  for (let i = 1; i <= columnCount; i += 1) {
    const cell = row.getCell(i);
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.headerFg } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.headerBg },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.accentLine } },
      bottom: { style: "thin", color: { argb: COLORS.accentLine } },
    };
  }
}

function styleDataRow(row: ExcelJS.Row, columnCount: number, zebra: boolean) {
  for (let i = 1; i <= columnCount; i += 1) {
    const cell = row.getCell(i);
    cell.font = { name: "Calibri", size: 11, color: { argb: COLORS.text } };
    cell.alignment = { vertical: "middle" };
    if (zebra) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.zebra },
      };
    }
    cell.border = {
      bottom: { style: "hair", color: { argb: COLORS.border } },
    };
  }
}

function styleMetricLabel(cell: ExcelJS.Cell) {
  cell.font = { name: "Calibri", size: 11, color: { argb: COLORS.text } };
  cell.alignment = { vertical: "middle" };
}

function styleMetricValue(cell: ExcelJS.Cell, options?: { accent?: boolean; danger?: boolean }) {
  cell.numFmt = MONEY_FMT;
  cell.font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: {
      argb: options?.danger ? COLORS.danger : options?.accent ? COLORS.positive : COLORS.money,
    },
  };
  cell.alignment = { vertical: "middle", horizontal: "right" };
}

function setColumnWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function addSheetBanner(sheet: ExcelJS.Worksheet, title: string, period: ReportPeriod, cols: number) {
  sheet.mergeCells(1, 1, 1, cols);
  sheet.mergeCells(2, 1, 2, cols);

  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  styleTitle(titleCell);
  sheet.getRow(1).height = 28;

  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = `Periode ${period.fromKey} s/d ${period.toKey}  ·  Diekspor ${formatReportDateTime(new Date())}`;
  styleSubtitle(subtitleCell);
  sheet.getRow(2).height = 20;
}

export async function buildReportWorkbook(period: ReportPeriod): Promise<ExcelJS.Buffer> {
  const previousPeriod = resolvePreviousPeriod(period);

  const [summary, previousSummary, series, income, expenses] = await Promise.all([
    getReportSummary(period),
    getReportSummary(previousPeriod),
    getReportDailySeries(period),
    getReportIncomeRows({ period, take: 50_000 }),
    listExpenses({ from: period.from, to: period.to, take: 50_000 }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "R9host";
  wb.lastModifiedBy = "R9host Console";
  wb.created = new Date();
  wb.modified = new Date();
  wb.company = "R9host";

  // ── Ringkasan ──────────────────────────────────────────────
  const ringkasan = wb.addWorksheet("Ringkasan", {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 18 },
  });
  addSheetBanner(ringkasan, "Laporan Keuangan · R9host", period, 4);
  setColumnWidths(ringkasan, [34, 18, 18, 28]);

  ringkasan.getCell(4, 1).value = "KPI";
  ringkasan.getCell(4, 2).value = "Nilai periode";
  ringkasan.getCell(4, 3).value = "Periode lalu";
  ringkasan.getCell(4, 4).value = "Perubahan";
  styleHeaderRow(ringkasan.getRow(4), 4);

  const kpiRows: {
    label: string;
    current: number;
    previous: number;
    money?: boolean;
    accent?: boolean;
  }[] = [
    {
      label: "Pendapatan bersih",
      current: summary.netProfit,
      previous: previousSummary.netProfit,
      money: true,
      accent: true,
    },
    {
      label: "Nilai transaksi (order PAID)",
      current: summary.orderOmzet,
      previous: previousSummary.orderOmzet,
      money: true,
    },
    {
      label: "Total margin SKU",
      current: summary.orderMarginTotal,
      previous: previousSummary.orderMarginTotal,
      money: true,
    },
    {
      label: "Pengeluaran",
      current: summary.expenseTotal,
      previous: previousSummary.expenseTotal,
      money: true,
    },
    {
      label: "Jumlah order PAID",
      current: summary.orderCount,
      previous: previousSummary.orderCount,
    },
    {
      label: "Jumlah item pengeluaran",
      current: summary.expenseCount,
      previous: previousSummary.expenseCount,
    },
  ];

  kpiRows.forEach((item, index) => {
    const rowNumber = 5 + index;
    const row = ringkasan.getRow(rowNumber);
    const delta = calcReportDelta(item.current, item.previous);

    row.getCell(1).value = item.label;
    row.getCell(2).value = item.current;
    row.getCell(3).value = item.previous;
    row.getCell(4).value = delta.label === "Baru" ? "Baru" : `${delta.label} vs periode lalu`;

    styleDataRow(row, 4, index % 2 === 1);
    styleMetricLabel(row.getCell(1));

    if (item.money) {
      styleMetricValue(row.getCell(2), { accent: item.accent, danger: item.current < 0 });
      styleMetricValue(row.getCell(3));
    } else {
      row.getCell(2).numFmt = "#,##0";
      row.getCell(3).numFmt = "#,##0";
      row.getCell(2).font = { name: "Calibri", size: 11, bold: true };
      row.getCell(3).font = { name: "Calibri", size: 11 };
      row.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
    }

    row.getCell(4).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb:
          delta.tone === "up" ? COLORS.positive : delta.tone === "down" ? COLORS.danger : COLORS.muted,
      },
    };
  });

  const noteStart = 12;
  ringkasan.getCell(noteStart, 1).value = "Definisi";
  ringkasan.getCell(noteStart, 1).font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: COLORS.headerFg },
  };
  ringkasan.getCell(noteStart, 1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.headerBg },
  };
  ringkasan.mergeCells(noteStart, 1, noteStart, 4);

  const notes = [
    "Pendapatan bersih = Total margin SKU (guest/member) − Pengeluaran.",
    "Nilai transaksi = total Order.amount dengan status PAID.",
    "Margin SKU memakai marginGuest jika order guest, marginMember jika order member.",
    "Deposit member tidak dihitung sebagai pendapatan penjualan.",
    `Pembanding: ${previousPeriod.fromKey} s/d ${previousPeriod.toKey}.`,
  ];
  notes.forEach((note, index) => {
    const cell = ringkasan.getCell(noteStart + 1 + index, 1);
    cell.value = note;
    cell.font = { name: "Calibri", size: 10, color: { argb: COLORS.muted }, italic: true };
    ringkasan.mergeCells(noteStart + 1 + index, 1, noteStart + 1 + index, 4);
  });

  if (summary.expenseByCategory.length > 0) {
    const catStart = noteStart + notes.length + 3;
    ringkasan.getCell(catStart, 1).value = "Pengeluaran per kategori";
    ringkasan.getCell(catStart, 2).value = "Nominal";
    ringkasan.getCell(catStart, 3).value = "Share";
    styleHeaderRow(ringkasan.getRow(catStart), 3);

    summary.expenseByCategory.forEach((item, index) => {
      const row = ringkasan.getRow(catStart + 1 + index);
      const share =
        summary.expenseTotal > 0 ? (item.amount / summary.expenseTotal) * 100 : 0;
      row.getCell(1).value = item.category;
      row.getCell(2).value = item.amount;
      row.getCell(3).value = share;
      styleDataRow(row, 3, index % 2 === 1);
      styleMetricValue(row.getCell(2));
      row.getCell(3).numFmt = PCT_FMT;
      row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
    });
  }

  // ── Pemasukan ──────────────────────────────────────────────
  const pemasukan = wb.addWorksheet("Pemasukan", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  addSheetBanner(pemasukan, "Pemasukan · Order PAID", period, 5);
  setColumnWidths(pemasukan, [22, 22, 18, 22, 14]);

  const incomeHeader = pemasukan.getRow(4);
  ["No", "Tanggal bayar", "Kode order", "Channel", "Nominal"].forEach((label, i) => {
    incomeHeader.getCell(i + 1).value = label;
  });
  styleHeaderRow(incomeHeader, 5);

  income.items.forEach((row, index) => {
    const excelRow = pemasukan.getRow(5 + index);
    excelRow.getCell(1).value = index + 1;
    excelRow.getCell(2).value = formatReportDateTime(row.paidAt);
    excelRow.getCell(3).value = row.code;
    excelRow.getCell(4).value = row.channel ?? "—";
    excelRow.getCell(5).value = row.amount;
    styleDataRow(excelRow, 5, index % 2 === 1);
    excelRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    styleMetricValue(excelRow.getCell(5));
  });

  const incomeTotalRow = pemasukan.getRow(5 + income.items.length);
  incomeTotalRow.getCell(1).value = "";
  incomeTotalRow.getCell(2).value = "";
  incomeTotalRow.getCell(3).value = "";
  incomeTotalRow.getCell(4).value = "TOTAL";
  incomeTotalRow.getCell(5).value = summary.orderOmzet;
  styleHeaderRow(incomeTotalRow, 5);
  styleMetricValue(incomeTotalRow.getCell(5), { accent: true });
  incomeTotalRow.getCell(4).font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: COLORS.headerFg },
  };

  if (income.items.length > 0) {
    pemasukan.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + income.items.length, column: 5 },
    };
  }

  // ── Pengeluaran ────────────────────────────────────────────
  const pengeluaran = wb.addWorksheet("Pengeluaran", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  addSheetBanner(pengeluaran, "Pengeluaran · Beban operasional", period, 6);
  setColumnWidths(pengeluaran, [8, 16, 24, 42, 18, 18]);

  const expenseHeader = pengeluaran.getRow(4);
  ["No", "Tanggal", "Kategori", "Deskripsi", "Admin", "Nominal"].forEach((label, i) => {
    expenseHeader.getCell(i + 1).value = label;
  });
  styleHeaderRow(expenseHeader, 6);

  expenses.items.forEach((row, index) => {
    const excelRow = pengeluaran.getRow(5 + index);
    excelRow.getCell(1).value = index + 1;
    excelRow.getCell(2).value = formatReportDate(row.date);
    excelRow.getCell(3).value =
      EXPENSE_CATEGORY_LABEL[row.category as ExpenseCategoryValue] ?? row.category;
    excelRow.getCell(4).value = row.description;
    excelRow.getCell(5).value = row.createdByName ?? "—";
    excelRow.getCell(6).value = row.amount;
    styleDataRow(excelRow, 6, index % 2 === 1);
    excelRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    styleMetricValue(excelRow.getCell(6), { danger: true });
  });

  const expenseTotalRow = pengeluaran.getRow(5 + expenses.items.length);
  expenseTotalRow.getCell(5).value = "TOTAL";
  expenseTotalRow.getCell(6).value = summary.expenseTotal;
  styleHeaderRow(expenseTotalRow, 6);
  styleMetricValue(expenseTotalRow.getCell(6), { danger: true });
  expenseTotalRow.getCell(5).font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: COLORS.headerFg },
  };

  if (expenses.items.length > 0) {
    pengeluaran.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + expenses.items.length, column: 6 },
    };
  }

  // ── Harian ─────────────────────────────────────────────────
  const harian = wb.addWorksheet("Harian", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  addSheetBanner(harian, "Deret harian · Omzet, margin, beban", period, 6);
  setColumnWidths(harian, [14, 16, 16, 16, 16, 14]);

  const dailyHeader = harian.getRow(4);
  [
    "Tanggal",
    "Nilai transaksi",
    "Margin SKU",
    "Pengeluaran",
    "Pendapatan bersih",
    "Order PAID",
  ].forEach((label, i) => {
    dailyHeader.getCell(i + 1).value = label;
  });
  styleHeaderRow(dailyHeader, 6);

  series.forEach((row, index) => {
    const excelRow = harian.getRow(5 + index);
    const net = row.orderMargin - row.expense;
    excelRow.getCell(1).value = row.date;
    excelRow.getCell(2).value = row.orderOmzet;
    excelRow.getCell(3).value = row.orderMargin;
    excelRow.getCell(4).value = row.expense;
    excelRow.getCell(5).value = net;
    excelRow.getCell(6).value = row.orderCount;
    styleDataRow(excelRow, 6, index % 2 === 1);
    styleMetricValue(excelRow.getCell(2));
    styleMetricValue(excelRow.getCell(3));
    styleMetricValue(excelRow.getCell(4), { danger: row.expense > 0 });
    styleMetricValue(excelRow.getCell(5), { accent: true, danger: net < 0 });
    excelRow.getCell(6).numFmt = "#,##0";
    excelRow.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
  });

  const dailyTotal = harian.getRow(5 + series.length);
  dailyTotal.getCell(1).value = "TOTAL";
  dailyTotal.getCell(2).value = summary.orderOmzet;
  dailyTotal.getCell(3).value = summary.orderMarginTotal;
  dailyTotal.getCell(4).value = summary.expenseTotal;
  dailyTotal.getCell(5).value = summary.netProfit;
  dailyTotal.getCell(6).value = summary.orderCount;
  styleHeaderRow(dailyTotal, 6);
  styleMetricValue(dailyTotal.getCell(2));
  styleMetricValue(dailyTotal.getCell(3));
  styleMetricValue(dailyTotal.getCell(4), { danger: true });
  styleMetricValue(dailyTotal.getCell(5), { accent: true });
  dailyTotal.getCell(6).font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: COLORS.headerFg },
  };
  dailyTotal.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
  dailyTotal.getCell(6).numFmt = "#,##0";

  if (series.length > 0) {
    harian.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + series.length, column: 6 },
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ExcelJS.Buffer;
}

export function reportDownloadFilename(period: ReportPeriod): string {
  return `laporan-r9host-${period.fromKey.replace(/-/g, "")}-${period.toKey.replace(/-/g, "")}.xlsx`;
}

export function formatSummaryLine(label: string, value: number): string {
  return `${label}: ${formatReportRupiah(value)}`;
}
