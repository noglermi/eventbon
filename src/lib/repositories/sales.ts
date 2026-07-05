import { supabase } from "@/lib/supabase/client";
import type { CartItem, Language, ProductTileData } from "@/components/sales-terminal/types";

type SaleRow = {
  id: string;
};

type RecentSaleRow = {
  id: string;
  tenant_id: string;
  event_id: string;
  total_cents: number;
  payment_method: string;
  cash_received_cents: number | null;
  change_cents: number | null;
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

type SaveCompletedSaleInput = {
  cartItems: CartItem[];
  changeCents: number;
  eventId: string;
  language: Language;
  productsById: Map<string, ProductTileData>;
  receivedCents: number;
  tenantId: string;
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
  paymentMethod: "cash" | "manual_card";
  cashReceivedCents: number | null;
  changeCents: number | null;
  createdAt: string;
  itemCount: number;
  items: RecentSaleItem[];
};

type SaleItemPayload = {
  tenant_id: string;
  sale_id: string;
  product_id: string | null;
  name_snapshot: string;
  group_key_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
  line_total_cents: number;
  created_at: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
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
    paymentMethod: row.payment_method === "manual_card" ? "manual_card" : "cash",
    cashReceivedCents: row.cash_received_cents,
    changeCents: row.change_cents,
    createdAt: row.created_at,
    itemCount: mappedItems.reduce((sum, item) => sum + item.quantity, 0),
    items: mappedItems,
  };
}

export async function listRecentSales(input: { eventId: string; tenantId: string; limit?: number }) {
  const client = requireSupabase();
  const limit = input.limit ?? 10;

  const { data: saleRows, error: salesError } = await client
    .from("sales")
    .select("id, tenant_id, event_id, total_cents, payment_method, cash_received_cents, change_cents, created_at")
    .eq("tenant_id", input.tenantId)
    .eq("event_id", input.eventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (salesError) {
    console.error("Recent sales load failed", {
      error: salesError,
      eventId: input.eventId,
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

export async function saveCompletedSale(input: SaveCompletedSaleInput) {
  const client = requireSupabase();
  const createdAt = new Date().toISOString();

  console.info("Creating completed sale in Supabase", {
    eventId: input.eventId,
    itemCount: input.cartItems.length,
    tenantId: input.tenantId,
    totalCents: input.totalCents,
  });

  for (const item of input.cartItems) {
    if (!input.productsById.has(item.productId)) {
      throw new Error("Cannot persist sale because product " + item.productId + " is missing from the current product list.");
    }
  }

  const { data: sale, error: saleError } = await client
    .from("sales")
    .insert({
      tenant_id: input.tenantId,
      event_id: input.eventId,
      total_cents: input.totalCents,
      payment_method: "cash",
      cash_received_cents: input.receivedCents,
      change_cents: input.changeCents,
      status: "completed",
      created_at: createdAt,
    })
    .select("id")
    .single();

  if (saleError) {
    console.error("Completed sale insert failed", {
      error: saleError,
      eventId: input.eventId,
      tenantId: input.tenantId,
    });
    throw saleError;
  }

  const saleId = (sale as SaleRow).id;
  const saleItems = input.cartItems.map((item): SaleItemPayload => {
    const product = input.productsById.get(item.productId);

    if (!product) {
      throw new Error("Cannot persist sale item because product " + item.productId + " is missing from the current product list.");
    }

    const priceCentsSnapshot = Math.round(product.price * 100);

    return {
      tenant_id: input.tenantId,
      sale_id: saleId,
      product_id: uuidPattern.test(product.id) ? product.id : null,
      name_snapshot: product.name[input.language],
      group_key_snapshot: product.group,
      price_cents_snapshot: priceCentsSnapshot,
      quantity: item.quantity,
      line_total_cents: priceCentsSnapshot * item.quantity,
      created_at: createdAt,
    };
  });

  const { error: saleItemsError } = await client
    .from("sale_items")
    .insert(saleItems);

  if (saleItemsError) {
    console.error("Completed sale item insert failed", {
      error: saleItemsError,
      eventId: input.eventId,
      saleId,
      tenantId: input.tenantId,
    });
    throw saleItemsError;
  }

  console.info("Completed sale saved in Supabase", {
    eventId: input.eventId,
    itemCount: saleItems.length,
    saleId,
    tenantId: input.tenantId,
  });

  return saleId;
}
