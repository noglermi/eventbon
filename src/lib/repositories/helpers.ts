import { supabase } from "@/lib/supabase/client";
import type { Event, HelperInvitation, PrintMode } from "@/types/domain";

type HelperInvitationRow = {
  id: string;
  event_id: string;
  code: string;
  label: string | null;
  station: string | null;
  is_active: boolean;
  created_at: string;
};

type EventRow = {
  id: string;
  organizer_id: string | null;
  tenant_id: string | null;
  name: string;
  starts_at: string;
  ends_at: string;
  access_until: string;
  print_mode: PrintMode;
  status: string;
  created_at: string;
  updated_at: string;
};

export type HelperInvitationCreateInput = {
  eventId: string;
  label?: string | null;
  station?: string | null;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function mapInvitation(row: HelperInvitationRow): HelperInvitation {
  return {
    id: row.id,
    eventId: row.event_id,
    code: row.code,
    label: row.label,
    station: row.station,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    organizerId: row.organizer_id,
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

function createAccessCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(8);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

export async function listHelperInvitations(eventId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("helper_invitations")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as HelperInvitationRow[]).map(mapInvitation);
}

export async function createHelperInvitation(input: HelperInvitationCreateInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("helper_invitations")
    .insert({
      event_id: input.eventId,
      code: createAccessCode(),
      label: input.label?.trim() || null,
      station: input.station?.trim() || null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapInvitation(data as HelperInvitationRow);
}

export async function getHelperInvitationByCode(code: string) {
  const client = requireSupabase();
  const normalizedCode = code.trim().toUpperCase();
  const { data: invitationRow, error: invitationError } = await client
    .from("helper_invitations")
    .select("*")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .maybeSingle();

  if (invitationError) {
    throw invitationError;
  }

  if (!invitationRow) {
    return null;
  }

  const invitation = mapInvitation(invitationRow as HelperInvitationRow);
  const { data: eventRow, error: eventError } = await client
    .from("events")
    .select("*")
    .eq("id", invitation.eventId)
    .single();

  if (eventError) {
    throw eventError;
  }

  return {
    invitation,
    event: mapEvent(eventRow as EventRow),
  };
}
