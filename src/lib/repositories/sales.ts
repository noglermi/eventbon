import { supabase } from "@/lib/supabase/client";
import type { CartItem, Language, ProductTileData } from "@/components/sales-terminal/types";

type SaleRow = {
  id: string;
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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
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
  const saleItems = input.cartItems.flatMap((item) => {
    const product = input.productsById.get(item.productId);

    if (!product) {
      return [];
    }

    const unitPriceCents = Math.round(product.price * 100);

    return [{
      tenant_id: input.tenantId,
      sale_id: saleId,
      product_id: uuidPattern.test(product.id) ? product.id : null,
      name_snapshot: product.name[input.language],
      group_key_snapshot: product.group,
      unit_price_cents: unitPriceCents,
      quantity: item.quantity,
      line_total_cents: unitPriceCents * item.quantity,
      created_at: createdAt,
    }];
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
