import { supabase } from "@/lib/supabase/client";
import type { ProductTileData, TileGroupName } from "@/components/sales-terminal/types";

type ProductGroupKey = "drinks" | "food" | "desserts" | "other";

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
const productImagesBucket = "product-images";
const textColorByColor: Record<string, string> = {
  "#f8c755": "#3a2500",
  "#81d4f7": "#073447",
  "#83c57c": "#0d3213",
  "#f5a8c7": "#431022",
  "#b49af4": "#221046",
};
const groupToStorageKey: Record<TileGroupName, ProductGroupKey> = {
  Drinks: "drinks",
  Food: "food",
  Desserts: "desserts",
  Other: "other",
};
const storageKeyToGroup: Record<ProductGroupKey, TileGroupName> = {
  drinks: "Drinks",
  food: "Food",
  desserts: "Desserts",
  other: "Other",
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

function toProductGroupKey(group: TileGroupName) {
  return groupToStorageKey[group];
}

function fromProductGroupKey(groupKey: string): TileGroupName {
  return storageKeyToGroup[groupKey as ProductGroupKey] ?? "Other";
}

function safeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product-image";
}

async function ensureProductImagesBucket() {
  const client = requireSupabase();
  const { error } = await client.storage.getBucket(productImagesBucket);

  if (!error) {
    return;
  }

  const { error: createError } = await client.storage.createBucket(productImagesBucket, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (createError) {
    throw new Error(
      "Supabase Storage bucket product-images is not available. Create a public bucket named product-images or allow bucket creation. " + createError.message,
    );
  }
}

async function uploadProductImage(input: ProductSaveInput) {
  if (!input.product.imageFile) {
    return input.product.image ?? null;
  }

  const client = requireSupabase();
  await ensureProductImagesBucket();

  const pathId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  const storagePath = [
    input.tenantId,
    input.eventId,
    pathId + "-" + safeFileName(input.product.imageFile.name),
  ].join("/");

  const { error } = await client.storage
    .from(productImagesBucket)
    .upload(storagePath, input.product.imageFile, {
      cacheControl: "3600",
      contentType: input.product.imageFile.type,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(productImagesBucket).getPublicUrl(storagePath);

  if (!data.publicUrl) {
    throw new Error("Supabase Storage did not return a public product image URL.");
  }

  return data.publicUrl;
}

function mapProduct(row: ProductRow): ProductTileData {
  return {
    id: row.id,
    name: { de: row.name, en: row.name },
    price: row.price_cents / 100,
    group: fromProductGroupKey(row.group_key),
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

async function toPayload(input: ProductSaveInput) {
  const crop = input.product.imageCrop ?? { zoom: 1, x: 50, y: 50 };
  const imageUrl = await uploadProductImage(input);

  return {
    tenant_id: input.tenantId,
    event_id: input.eventId,
    name: input.product.name.de,
    price_cents: Math.round(input.product.price * 100),
    group_key: toProductGroupKey(input.product.group),
    color: input.product.color,
    icon: input.product.icon ?? "⭐",
    image_url: imageUrl,
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
    .order("group_key", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as ProductRow[]).map(mapProduct);
}

export async function saveProduct(input: ProductSaveInput) {
  const client = requireSupabase();
  const payload = await toPayload(input);
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
