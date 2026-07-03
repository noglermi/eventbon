import { supabase } from "@/lib/supabase/client";
import type { ProductTileData, TileGroupName } from "@/components/sales-terminal/types";

type ProductRow = {
  id: string;
  tenant_id: string;
  event_id: string;
  name: string;
  price_cents: number;
  group_key: string;
  color: string;
  icon: string;
  image_url: string | null;
  image_crop_zoom: number | string;
  image_crop_x: number | string;
  image_crop_y: number | string;
  position: number;
  is_active: boolean;
};

type ProductSaveInput = {
  tenantId: string;
  eventId: string;
  product: ProductTileData;
  position: number;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const textColorByColor: Record<string, string> = {
  "#f8c755": "#3a2500",
  "#81d4f7": "#073447",
  "#83c57c": "#0d3213",
  "#f5a8c7": "#431022",
  "#b49af4": "#221046",
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function asNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapProduct(row: ProductRow): ProductTileData {
  return {
    id: row.id,
    name: { de: row.name, en: row.name },
    price: row.price_cents / 100,
    group: row.group_key as TileGroupName,
    icon: row.icon,
    image: row.image_url ?? undefined,
    imageCrop: {
      zoom: asNumber(row.image_crop_zoom),
      x: asNumber(row.image_crop_x),
      y: asNumber(row.image_crop_y),
    },
    color: row.color,
    textColor: textColorByColor[row.color] ?? "#0f172a",
  };
}

function toPayload(input: ProductSaveInput) {
  const crop = input.product.imageCrop ?? { zoom: 1, x: 50, y: 50 };

  return {
    tenant_id: input.tenantId,
    event_id: input.eventId,
    name: input.product.name.de,
    price_cents: Math.round(input.product.price * 100),
    group_key: input.product.group,
    color: input.product.color,
    icon: input.product.icon ?? "⭐",
    image_url: input.product.image ?? null,
    image_crop_zoom: crop.zoom,
    image_crop_x: crop.x,
    image_crop_y: crop.y,
    position: input.position,
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

export async function listProducts(eventId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as ProductRow[]).map(mapProduct);
}

export async function saveProduct(input: ProductSaveInput) {
  const client = requireSupabase();
  const payload = toPayload(input);
  const shouldUpdate = uuidPattern.test(input.product.id);

  if (shouldUpdate) {
    const { data, error } = await client
      .from("products")
      .update(payload)
      .eq("tenant_id", input.tenantId)
      .eq("event_id", input.eventId)
      .eq("id", input.product.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapProduct(data as ProductRow);
  }

  const { data, error } = await client
    .from("products")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapProduct(data as ProductRow);
}
