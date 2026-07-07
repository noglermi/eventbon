import { supabase } from "@/lib/supabase/client";
import type { ActiveHelperSession, CartItem, Language, PaymentMethod, ProductTileData } from "@/components/sales-terminal/types";

type RecentSaleRow = {
  id: string;
  tenant_id: string;
  event_id: string;
  total_cents: number;
  payment_method: string;
  cash_received_cents: number | null;
  change_cents: number | null;
  helper_invitation_id: string | null;
  helper_name_snapshot: string | null;
  helper_station_snapshot: string | null;
  terminal_id: string | null;
  print_count: number | null;
  printed_at: string | null;
  created_at: string;
};

type RecentSaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string | null;
  name_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
  line_total_cents: number;
  created_at: string;
};

type AnalyticsSaleRow = {
  id: string;
  total_cents: number;
  payment_method: string;
  created_at: string;
};

type AnalyticsSaleItemRow = {
  sale_id: string;
  name_snapshot: string;
  quantity: number;
  line_total_cents: number;
};

type ExportSaleItemRow = AnalyticsSaleItemRow & {
  price_cents_snapshot: number;
};

type SaveCompletedSaleInput = {
  cartItems: CartItem[];
  changeCents: number;
  eventId: string;
  helperSession?: ActiveHelperSession | null;
  language: Language;
  paymentMethod: PaymentMethod;
  productsById: Map<string, ProductTileData>;
  receivedCents: number;
  tenantId: string;
  terminalId: string;
  totalCents: number;
};

export type RecentSaleItem = {
  id: string;
  productId: string | null;
  nameSnapshot: string;
  priceCentsSnapshot: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: string;
};

export type RecentSale = {
  id: string;
  tenantId: string;
  eventId: string;
  totalCents: number;
  paymentMethod: PaymentMethod;
  cashReceivedCents: number | null;
  changeCents: number | null;
  helperInvitationId: string | null;
  helperNameSnapshot: string | null;
  helperStationSnapshot: string | null;
  terminalId: string | null;
  printCount: number;
  printedAt: string | null;
  createdAt: string;
  itemCount: number;
  items: RecentSaleItem[];
};

export type SalesAnalyticsProduct = {
  name: string;
  quantity: number;
  revenueCents: number;
};

export type SalesAnalyticsHour = {
  hour: number;
  revenueCents: number;
};

export type SalesAnalyticsSummary = {
  totalRevenueCents: number;
  saleCount: number;
  voucherCount: number;
  averageSaleCents: number;
  paymentTotals: {
    cashCents: number;
    cardCents: number;
  };
  hourlyRevenue: SalesAnalyticsHour[];
  topProducts: SalesAnalyticsProduct[];
};

export type SalesExportSaleItem = {
  saleId: string;
  nameSnapshot: string;
  priceCentsSnapshot: number;
  quantity: number;
  lineTotalCents: number;
};

export type SalesExportSale = {
  id: string;
  totalCents: number;
  paymentMethod: PaymentMethod;
  cashReceivedCents: number | null;
  changeCents: number | null;
  helperNameSnapshot: string | null;
  helperStationSnapshot: string | null;
  createdAt: string;
  itemCount: number;
  items: SalesExportSaleItem[];
};

type SaleItemPayload = {
  product_id: string | null;
  name_snapshot: string;
  group_key_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
  line_total_cents: number;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emptyHourlyRevenue = Array.from({ length: 24 }, (_, hour) => ({ hour, revenueCents: 0 }));

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function normalizePaymentMethod(value: string | null | undefined): PaymentMethod {
  return value === "card" || value === "manual_card" || value === "card_manual" ? "card_manual" : "cash";
}

function mapRecentSale(row: RecentSaleRow, items: RecentSaleItemRow[]): RecentSale {
  const mappedItems = items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    nameSnapshot: item.name_snapshot,
    priceCentsSnapshot: item.price_cents_snapshot,
    quantity: item.quantity,
    lineTotalCents: item.line_total_cents,
    createdAt: item.created_at,
  }));

  return {
    id: row.id,
    tenantId: row.tenant_id,
    eventId: row.event_id,
    totalCents: row.total_cents,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    cashReceivedCents: row.cash_received_cents,
    changeCents: row.change_cents,
    helperInvitationId: row.helper_invitation_id,
    helperNameSnapshot: row.helper_name_snapshot,
    helperStationSnapshot: row.helper_station_snapshot,
    terminalId: row.terminal_id,
    printCount: row.print_count ?? 0,
    printedAt: row.printed_at,
    createdAt: row.created_at,
    itemCount: mappedItems.reduce((sum, item) => sum + item.quantity, 0),
    items: mappedItems,
  };
}

export async function listRecentSales(input: { eventId: string; tenantId: string; terminalId: string; limit?: number }) {
  const client = requireSupabase();
  const limit = input.limit ?? 10;

  const { data: saleRows, error: salesError } = await client
    .from("sales")
    .select("id, tenant_id, event_id, total_cents, payment_method, cash_received_cents, change_cents, helper_invitation_id, helper_name_snapshot, helper_station_snapshot, terminal_id, print_count, printed_at, created_at")
    .eq("tenant_id", input.tenantId)
    .eq("event_id", input.eventId)
    .eq("terminal_id", input.terminalId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (salesError) {
    console.error("Recent sales load failed", {
      error: salesError,
      eventId: input.eventId,
      terminalId: input.terminalId,
      tenantId: input.tenantId,
    });
    throw salesError;
  }

  const sales = (saleRows ?? []) as RecentSaleRow[];
  const saleIds = sales.map((sale) => sale.id);

  if (saleIds.length === 0) {
    return [];
  }

  const { data: itemRows, error: itemsError } = await client
    .from("sale_items")
    .select("id, sale_id, product_id, name_snapshot, price_cents_snapshot, quantity, line_total_cents, created_at")
    .eq("tenant_id", input.tenantId)
    .in("sale_id", saleIds)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Recent sale items load failed", {
      error: itemsError,
      eventId: input.eventId,
      saleIds,
      tenantId: input.tenantId,
    });
    throw itemsError;
  }

  const itemsBySale = ((itemRows ?? []) as RecentSaleItemRow[]).reduce((groups, item) => {
    const current = groups.get(item.sale_id) ?? [];
    current.push(item);
    groups.set(item.sale_id, current);
    return groups;
  }, new Map<string, RecentSaleItemRow[]>());

  return sales.map((sale) => mapRecentSale(sale, itemsBySale.get(sale.id) ?? []));
}

export async function getSalesAnalytics(input: { createdFrom?: string; createdTo?: string; eventId: string; tenantId: string }): Promise<SalesAnalyticsSummary> {
  const client = requireSupabase();

  let salesQuery = client
    .from("sales")
    .select("id, total_cents, payment_method, created_at")
    .eq("tenant_id", input.tenantId)
    .eq("event_id", input.eventId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (input.createdFrom) {
    salesQuery = salesQuery.gte("created_at", input.createdFrom);
  }

  if (input.createdTo) {
    salesQuery = salesQuery.lt("created_at", input.createdTo);
  }

  const { data: saleRows, error: salesError } = await salesQuery;

  if (salesError) {
    console.error("Sales analytics load failed", {
      error: salesError,
      eventId: input.eventId,
      tenantId: input.tenantId,
    });
    throw salesError;
  }

  const sales = (saleRows ?? []) as AnalyticsSaleRow[];
  const saleIds = sales.map((sale) => sale.id);

  if (saleIds.length === 0) {
    return {
      totalRevenueCents: 0,
      saleCount: 0,
      voucherCount: 0,
      averageSaleCents: 0,
      paymentTotals: {
        cashCents: 0,
        cardCents: 0,
      },
      hourlyRevenue: emptyHourlyRevenue,
      topProducts: [],
    };
  }

  const { data: itemRows, error: itemsError } = await client
    .from("sale_items")
    .select("sale_id, name_snapshot, quantity, line_total_cents")
    .eq("tenant_id", input.tenantId)
    .in("sale_id", saleIds);

  if (itemsError) {
    console.error("Sales analytics item load failed", {
      error: itemsError,
      eventId: input.eventId,
      saleIds,
      tenantId: input.tenantId,
    });
    throw itemsError;
  }

  const items = (itemRows ?? []) as AnalyticsSaleItemRow[];
  const totalRevenueCents = sales.reduce((sum, sale) => sum + sale.total_cents, 0);
  const voucherCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const productTotals = new Map<string, SalesAnalyticsProduct>();
  const hourlyRevenue = emptyHourlyRevenue.map((entry) => ({ ...entry }));

  for (const item of items) {
    const current = productTotals.get(item.name_snapshot) ?? {
      name: item.name_snapshot,
      quantity: 0,
      revenueCents: 0,
    };

    current.quantity += item.quantity;
    current.revenueCents += item.line_total_cents;
    productTotals.set(item.name_snapshot, current);
  }

  for (const sale of sales) {
    const hour = new Date(sale.created_at).getHours();

    if (hour >= 0 && hour < hourlyRevenue.length) {
      hourlyRevenue[hour].revenueCents += sale.total_cents;
    }
  }

  return {
    totalRevenueCents,
    saleCount: sales.length,
    voucherCount,
    averageSaleCents: Math.round(totalRevenueCents / sales.length),
    paymentTotals: {
      cashCents: sales.filter((sale) => normalizePaymentMethod(sale.payment_method) === "cash").reduce((sum, sale) => sum + sale.total_cents, 0),
      cardCents: sales.filter((sale) => normalizePaymentMethod(sale.payment_method) === "card_manual").reduce((sum, sale) => sum + sale.total_cents, 0),
    },
    hourlyRevenue,
    topProducts: [...productTotals.values()].sort((first, second) => second.revenueCents - first.revenueCents || second.quantity - first.quantity || first.name.localeCompare(second.name)),
  };
}

export async function listSalesForExport(input: { createdFrom?: string; createdTo?: string; eventId: string; tenantId: string }): Promise<SalesExportSale[]> {
  const client = requireSupabase();

  let salesQuery = client
    .from("sales")
    .select("id, total_cents, payment_method, cash_received_cents, change_cents, helper_name_snapshot, helper_station_snapshot, created_at")
    .eq("tenant_id", input.tenantId)
    .eq("event_id", input.eventId)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  if (input.createdFrom) {
    salesQuery = salesQuery.gte("created_at", input.createdFrom);
  }

  if (input.createdTo) {
    salesQuery = salesQuery.lt("created_at", input.createdTo);
  }

  const { data: saleRows, error: salesError } = await salesQuery;

  if (salesError) {
    console.error("Sales export load failed", {
      error: salesError,
      eventId: input.eventId,
      tenantId: input.tenantId,
    });
    throw salesError;
  }

  const sales = (saleRows ?? []) as Array<Pick<RecentSaleRow, "id" | "total_cents" | "payment_method" | "cash_received_cents" | "change_cents" | "helper_name_snapshot" | "helper_station_snapshot" | "created_at">>;
  const saleIds = sales.map((sale) => sale.id);

  if (saleIds.length === 0) {
    return [];
  }

  const { data: itemRows, error: itemsError } = await client
    .from("sale_items")
    .select("sale_id, name_snapshot, price_cents_snapshot, quantity, line_total_cents")
    .eq("tenant_id", input.tenantId)
    .in("sale_id", saleIds)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Sales export item load failed", {
      error: itemsError,
      eventId: input.eventId,
      saleIds,
      tenantId: input.tenantId,
    });
    throw itemsError;
  }

  const itemsBySale = ((itemRows ?? []) as ExportSaleItemRow[]).reduce((groups, item) => {
    const current = groups.get(item.sale_id) ?? [];
    current.push({
      saleId: item.sale_id,
      nameSnapshot: item.name_snapshot,
      priceCentsSnapshot: item.price_cents_snapshot,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents,
    });
    groups.set(item.sale_id, current);
    return groups;
  }, new Map<string, SalesExportSaleItem[]>());

  return sales.map((sale) => {
    const items = itemsBySale.get(sale.id) ?? [];

    return {
      id: sale.id,
      totalCents: sale.total_cents,
      paymentMethod: normalizePaymentMethod(sale.payment_method),
      cashReceivedCents: sale.cash_received_cents,
      changeCents: sale.change_cents,
      helperNameSnapshot: sale.helper_name_snapshot,
      helperStationSnapshot: sale.helper_station_snapshot,
      createdAt: sale.created_at,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
    };
  });
}

export async function saveCompletedSale(input: SaveCompletedSaleInput) {
  const client = requireSupabase();
  const createdAt = new Date().toISOString();
  const persistedReceivedCents = input.paymentMethod === "card_manual" ? input.totalCents : input.receivedCents;
  const persistedChangeCents = input.paymentMethod === "card_manual" ? 0 : input.changeCents;
  const helperInvitationId = input.helperSession?.invitationId ?? null;
  const helperNameSnapshot = input.helperSession?.helperName ?? null;
  const helperStationSnapshot = input.helperSession?.station ?? null;

  console.info("Creating completed sale in Supabase", {
    eventId: input.eventId,
    itemCount: input.cartItems.length,
    helperInvitationId,
    paymentMethod: input.paymentMethod,
    terminalId: input.terminalId,
    tenantId: input.tenantId,
    totalCents: input.totalCents,
  });

  for (const item of input.cartItems) {
    if (!input.productsById.has(item.productId)) {
      throw new Error("Cannot persist sale because product " + item.productId + " is missing from the current product list.");
    }
  }

  const saleItems = input.cartItems.map((item): SaleItemPayload => {
    const product = input.productsById.get(item.productId);

    if (!product) {
      throw new Error("Cannot persist sale item because product " + item.productId + " is missing from the current product list.");
    }

    const priceCentsSnapshot = Math.round(product.price * 100);

    return {
      product_id: uuidPattern.test(product.id) ? product.id : null,
      name_snapshot: product.name[input.language],
      group_key_snapshot: product.group,
      price_cents_snapshot: priceCentsSnapshot,
      quantity: item.quantity,
      line_total_cents: priceCentsSnapshot * item.quantity,
    };
  });

  const { data: saleId, error: saleError } = await client.rpc("save_completed_sale", {
    p_cash_received_cents: persistedReceivedCents,
    p_change_cents: persistedChangeCents,
    p_created_at: createdAt,
    p_event_id: input.eventId,
    p_helper_invitation_id: helperInvitationId,
    p_helper_name_snapshot: helperNameSnapshot,
    p_helper_station_snapshot: helperStationSnapshot,
    p_items: saleItems,
    p_payment_method: input.paymentMethod,
    p_tenant_id: input.tenantId,
    p_terminal_id: input.terminalId,
    p_total_cents: input.totalCents,
  });

  if (saleError) {
    console.error("Completed sale transaction failed", {
      error: saleError,
      eventId: input.eventId,
      tenantId: input.tenantId,
    });
    throw saleError;
  }

  if (!saleId) {
    throw new Error("Completed sale transaction returned no sale id.");
  }

  console.info("Completed sale saved in Supabase", {
    eventId: input.eventId,
    itemCount: saleItems.length,
    saleId,
    tenantId: input.tenantId,
  });

  return saleId as string;
}

export async function recordSalePrint(input: { saleId: string; tenantId: string }) {
  const client = requireSupabase();

  const { data, error } = await client.rpc("increment_sale_print_count", {
    p_sale_id: input.saleId,
    p_tenant_id: input.tenantId,
  });

  if (error) {
    console.error("Sale print tracking failed", {
      error,
      saleId: input.saleId,
      tenantId: input.tenantId,
    });
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    printCount: Number(result?.print_count ?? 0),
    printedAt: result?.printed_at ? String(result.printed_at) : null,
  };
}
