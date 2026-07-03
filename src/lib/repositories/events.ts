import { supabase } from "@/lib/supabase/client";
import type { Event, PrintMode } from "@/types/domain";

type EventRow = {
  id: string;
  tenant_id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  access_until: string;
  print_mode: PrintMode;
  status: string;
  created_at: string;
  updated_at: string;
};

export type EventCreateInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  printMode: PrintMode;
};

export type EventUpdateInput = {
  id: string;
  tenantId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  accessUntil: string;
  printMode: PrintMode;
  status: string;
};

const defaultOrganizerName = "Demo Veranstalter";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function toDateTime(value: string) {
  return value.includes("T") ? value : value + "T00:00:00.000Z";
}

function addDays(value: string, days: number) {
  const date = new Date(toDateTime(value));
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    accessUntil: row.access_until,
    printMode: row.print_mode,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOrCreateTenantId() {
  const tenantId = await getFirstTenantId();

  if (tenantId) {
    return tenantId;
  }

  const client = requireSupabase();
  const { data: tenant, error: insertError } = await client
    .from("tenants")
    .insert({ name: defaultOrganizerName })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return String(tenant.id);
}

async function getFirstTenantId() {
  const client = requireSupabase();
  const { data: existingTenants, error: selectError } = await client
    .from("tenants")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (selectError) {
    throw selectError;
  }

  if (existingTenants?.[0]?.id) {
    return String(existingTenants[0].id);
  }

  return null;
}

export async function listEvents() {
  const client = requireSupabase();
  const tenantId = await getFirstTenantId();

  if (!tenantId) {
    return [];
  }

  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as EventRow[]).map(mapEvent);
}

export async function createEvent(input: EventCreateInput) {
  const client = requireSupabase();
  const tenantId = await getOrCreateTenantId();
  const endsAt = toDateTime(input.endsAt || input.startsAt);
  const { data, error } = await client
    .from("events")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      starts_at: toDateTime(input.startsAt),
      ends_at: endsAt,
      access_until: addDays(endsAt, 7),
      print_mode: input.printMode,
      status: "preparation",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapEvent(data as EventRow);
}

export async function updateEventBasics(input: EventUpdateInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("events")
    .update({
      name: input.name,
      starts_at: toDateTime(input.startsAt),
      ends_at: toDateTime(input.endsAt),
      access_until: toDateTime(input.accessUntil),
      print_mode: input.printMode,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapEvent(data as EventRow);
}
