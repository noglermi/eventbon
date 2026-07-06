import ExcelJS from "exceljs";
import type { EventSettings, Language } from "@/components/sales-terminal/types";
import type { SalesAnalyticsSummary, SalesExportSale } from "@/lib/repositories/sales";
import { formatDateRange } from "@/lib/date-format";

type SalesWorkbookInput = {
  eventName: string;
  eventSettings: EventSettings;
  exportDate: Date;
  language: Language;
  sales: SalesExportSale[];
  summary: SalesAnalyticsSummary;
};

const currencyFormat = '#,##0.00 "€"';
const dateTimeFormat = "dd.mm.yyyy hh:mm";
const timeFormat = "hh:mm";
const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } } as const;
const headerFont = { bold: true, color: { argb: "FFFFFFFF" } };
const titleFont = { bold: true, color: { argb: "FF047857" }, size: 18 };

function centsToEuro(cents: number) {
  return cents / 100;
}

function toDate(value: string) {
  return new Date(value);
}

function formatHour(hour: number) {
  return String(hour).padStart(2, "0") + ":00";
}

function paymentLabel(paymentMethod: SalesExportSale["paymentMethod"], language: Language) {
  if (paymentMethod === "card_manual") {
    return language === "de" ? "Karte" : "Card";
  }

  return language === "de" ? "Bar" : "Cash";
}

function safeFileNamePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Event";
}

function exportDateStamp(date: Date) {
  return date.toISOString().slice(0, 10);
}

function styleHeaderRow(worksheet: ExcelJS.Worksheet, rowNumber = 1) {
  const row = worksheet.getRow(rowNumber);
  row.font = headerFont;
  row.fill = headerFill;
  row.alignment = { vertical: "middle" };
}

function styleTableHeader(worksheet: ExcelJS.Worksheet) {
  styleHeaderRow(worksheet, 1);
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
}

function autoSizeColumns(worksheet: ExcelJS.Worksheet, minimum = 12, maximum = 34) {
  worksheet.columns.forEach((column) => {
    let width = minimum;

    if (!column.eachCell) {
      return;
    }

    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      const text = value instanceof Date
        ? "00.00.0000 00:00"
        : typeof value === "object" && value !== null && "richText" in value
          ? ""
          : String(value ?? "");
      width = Math.max(width, Math.min(maximum, text.length + 3));
    });

    column.width = width;
  });
}

function addTable(worksheet: ExcelJS.Worksheet, name: string, columns: string[], rows: Array<Array<string | number | Date | null>>) {
  worksheet.addTable({
    name,
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium2",
      showRowStripes: true,
    },
    columns: columns.map((header) => ({ name: header })),
    rows,
  });
  styleTableHeader(worksheet);
}

function styleCurrencyColumn(worksheet: ExcelJS.Worksheet, columnNumber: number, fromRow = 2) {
  worksheet.getColumn(columnNumber).eachCell((cell, rowNumber) => {
    if (rowNumber >= fromRow) {
      cell.numFmt = currencyFormat;
    }
  });
}

function styleIntegerColumn(worksheet: ExcelJS.Worksheet, columnNumber: number, fromRow = 2) {
  worksheet.getColumn(columnNumber).eachCell((cell, rowNumber) => {
    if (rowNumber >= fromRow) {
      cell.numFmt = "#,##0";
    }
  });
}

function applySheetDefaults(worksheet: ExcelJS.Worksheet) {
  worksheet.properties.defaultRowHeight = 20;
  worksheet.eachRow((row) => {
    row.alignment = { vertical: "middle" };
  });
}

export function getSalesWorkbookFilename(eventName: string, exportDate: Date) {
  return "eventBon_" + safeFileNamePart(eventName) + "_" + exportDateStamp(exportDate) + ".xlsx";
}

export async function buildSalesWorkbook(input: SalesWorkbookInput) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "eventBon";
  workbook.created = input.exportDate;
  workbook.modified = input.exportDate;
  workbook.calcProperties.fullCalcOnLoad = true;

  const overview = workbook.addWorksheet("Overview", { views: [{ state: "frozen", ySplit: 1 }] });
  overview.mergeCells("A1:B1");
  overview.getCell("A1").value = "eventBon Export";
  overview.getCell("A1").font = titleFont;
  overview.getCell("A1").alignment = { vertical: "middle" };
  overview.getRow(1).height = 28;
  overview.getColumn(1).width = 26;
  overview.getColumn(2).width = 28;
  overview.getColumn(1).font = { bold: true };
  overview.addRows([
    [],
    ["Event name", input.eventName],
    ["Event date", formatDateRange(input.eventSettings, input.language)],
    ["Export date/time", input.exportDate],
    ["Total revenue", centsToEuro(input.summary.totalRevenueCents)],
    ["Number of sales", input.summary.saleCount],
    ["Number of vouchers", input.summary.voucherCount],
    ["Average sale value", centsToEuro(input.summary.averageSaleCents)],
    ["Cash revenue", centsToEuro(input.summary.paymentTotals.cashCents)],
    ["Card revenue", centsToEuro(input.summary.paymentTotals.cardCents)],
  ]);
  overview.getCell("B4").numFmt = dateTimeFormat;
  ["B5", "B8", "B9", "B10"].forEach((address) => {
    overview.getCell(address).numFmt = currencyFormat;
  });
  ["B6", "B7"].forEach((address) => {
    overview.getCell(address).numFmt = "#,##0";
  });
  overview.eachRow((row, rowNumber) => {
    if (rowNumber >= 3) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    }
  });

  const productSummary = workbook.addWorksheet("Product Summary");
  const productRows = input.summary.topProducts.map((product) => [
    product.name,
    product.quantity,
    centsToEuro(product.revenueCents),
  ]);
  addTable(productSummary, "ProductSummary", ["Product", "Quantity sold", "Revenue"], productRows);
  const productTotalRow = productSummary.addRow([
    "Total",
    input.summary.topProducts.reduce((sum, product) => sum + product.quantity, 0),
    centsToEuro(input.summary.topProducts.reduce((sum, product) => sum + product.revenueCents, 0)),
  ]);
  productTotalRow.font = { bold: true };
  productTotalRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  });
  styleIntegerColumn(productSummary, 2);
  styleCurrencyColumn(productSummary, 3);

  const sales = workbook.addWorksheet("Sales");
  addTable(sales, "Sales", ["Time", "Payment type", "Total", "Received", "Change", "Number of products", "Helper", "Station"], input.sales.map((sale) => [
    toDate(sale.createdAt),
    paymentLabel(sale.paymentMethod, input.language),
    centsToEuro(sale.totalCents),
    sale.cashReceivedCents === null ? null : centsToEuro(sale.cashReceivedCents),
    sale.changeCents === null ? null : centsToEuro(sale.changeCents),
    sale.itemCount,
    sale.helperNameSnapshot,
    sale.helperStationSnapshot,
  ]));
  sales.getColumn(1).eachCell((cell, rowNumber) => {
    if (rowNumber >= 2) {
      cell.numFmt = timeFormat;
    }
  });
  [3, 4, 5].forEach((columnNumber) => styleCurrencyColumn(sales, columnNumber));
  styleIntegerColumn(sales, 6);

  const saleDetails = workbook.addWorksheet("Sale Details");
  addTable(saleDetails, "SaleDetails", ["Sale Time", "Product", "Quantity", "Unit Price", "Line Total"], input.sales.flatMap((sale) => (
    sale.items.map((item) => [
      toDate(sale.createdAt),
      item.nameSnapshot,
      item.quantity,
      centsToEuro(item.priceCentsSnapshot),
      centsToEuro(item.lineTotalCents),
    ])
  )));
  saleDetails.getColumn(1).eachCell((cell, rowNumber) => {
    if (rowNumber >= 2) {
      cell.numFmt = timeFormat;
    }
  });
  styleIntegerColumn(saleDetails, 3);
  [4, 5].forEach((columnNumber) => styleCurrencyColumn(saleDetails, columnNumber));

  const hourlySales = Array.from({ length: 24 }, (_, hour) => ({ hour, revenueCents: 0, saleCount: 0 }));
  for (const sale of input.sales) {
    const hour = toDate(sale.createdAt).getHours();
    if (hour >= 0 && hour < hourlySales.length) {
      hourlySales[hour].saleCount += 1;
      hourlySales[hour].revenueCents += sale.totalCents;
    }
  }

  const revenueByHour = workbook.addWorksheet("Revenue by Hour");
  addTable(revenueByHour, "RevenueByHour", ["Hour", "Sales", "Revenue"], hourlySales.map((entry) => [
    formatHour(entry.hour),
    entry.saleCount,
    centsToEuro(entry.revenueCents),
  ]));
  styleIntegerColumn(revenueByHour, 2);
  styleCurrencyColumn(revenueByHour, 3);

  workbook.worksheets.forEach((worksheet) => {
    applySheetDefaults(worksheet);
    autoSizeColumns(worksheet);
  });

  return workbook;
}

export async function saveSalesWorkbook(input: SalesWorkbookInput) {
  const workbook = await buildSalesWorkbook(input);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = getSalesWorkbookFilename(input.eventName, input.exportDate);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
