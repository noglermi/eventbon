import { supabase } from "@/lib/supabase/client";
import { normalizeAllergenCodes } from "@/lib/allergens";
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
  allergen_codes?: string[] | null;
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

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function uploadProductImage(input: ProductSaveInput) {
  if (!input.product.imageFile) {
    return input.product.image ?? null;
  }

  const client = requireSupabase();

  const file = input.product.imageFile;
  const safeName = safeFileName(file.name);
  const fileExtension = getFileExtension(file);
  const timestampedName = Date.now() + "-" + (safeName.includes(".") ? safeName : safeName + "." + fileExtension);
  const storagePath = input.eventId + "/" + timestampedName;

  console.info("Uploading product image to Supabase Storage", {
    bucket: productImagesBucket,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    productId: input.product.id,
    storagePath,
  });

  const { error } = await client.storage
    .from(productImagesBucket)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("Product image upload failed", {
      bucket: productImagesBucket,
      error,
      storagePath,
    });
    throw error;
  }

  console.info("Product image upload succeeded", {
    bucket: productImagesBucket,
    storagePath,
  });

  const { data } = client.storage.from(productImagesBucket).getPublicUrl(storagePath);

  if (!data.publicUrl) {
    console.error("Supabase Storage did not return a public product image URL", {
      bucket: productImagesBucket,
      storagePath,
    });
    throw new Error("Supabase Storage did not return a public product image URL.");
  }

  console.info("Generated public product image URL", {
    bucket: productImagesBucket,
    publicUrl: data.publicUrl,
    storagePath,
  });

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
    allergens: normalizeAllergenCodes(row.allergen_codes),
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
    allergen_codes: normalizeAllergenCodes(input.product.allergens),
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
    console.info("Updating product in Supabase", {
      eventId: input.eventId,
      productId: input.product.id,
      tenantId: input.tenantId,
    });

    const { data, error } = await client
      .from("products")
      .update(payload)
      .eq("tenant_id", input.tenantId)
      .eq("event_id", input.eventId)
      .eq("id", input.product.id)
      .select("*")
      .single();

    if (error) {
      console.error("Product update failed", {
        error,
        eventId: input.eventId,
        productId: input.product.id,
        tenantId: input.tenantId,
      });
      throw error;
    }

    console.info("Product update succeeded", {
      eventId: input.eventId,
      productId: input.product.id,
      tenantId: input.tenantId,
    });

    return mapProduct(data as ProductRow);
  }

  console.info("Creating product in Supabase", {
    eventId: input.eventId,
    tenantId: input.tenantId,
  });

  const { data, error } = await client
    .from("products")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Product insert failed", {
      error,
      eventId: input.eventId,
      tenantId: input.tenantId,
    });
    throw error;
  }

  console.info("Product insert succeeded", {
    eventId: input.eventId,
    productId: (data as ProductRow).id,
    tenantId: input.tenantId,
  });

  return mapProduct(data as ProductRow);
}
