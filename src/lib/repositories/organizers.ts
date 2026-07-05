import { supabase } from "@/lib/supabase/client";
import type { Organizer } from "@/types/domain";

type OrganizerRow = {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  created_at: string;
};

export const mockOrganizer: Organizer = {
  id: "mock-organizer-dr-michael-nogler",
  authUserId: null,
  email: "michael.nogler@example.com",
  name: "Dr. Michael Nogler",
  company: null,
  phone: null,
  createdAt: new Date(0).toISOString(),
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function mapOrganizer(row: OrganizerRow): Organizer {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    name: row.name,
    company: row.company,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

export async function listOrganizers() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("organizers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as OrganizerRow[]).map(mapOrganizer);
}

export async function getCurrentOrganizer() {
  const organizers = await listOrganizers();
  return organizers[0] ?? null;
}

export async function getOrganizerForAuthenticatedUser(input: { email: string; name: string; userId: string }) {
  const client = requireSupabase();

  const { data: linkedOrganizer, error: linkedError } = await client
    .from("organizers")
    .select("*")
    .eq("auth_user_id", input.userId)
    .maybeSingle();

  if (linkedError) {
    throw linkedError;
  }

  if (linkedOrganizer) {
    return mapOrganizer(linkedOrganizer as OrganizerRow);
  }

  const { data: emailOrganizer, error: emailError } = await client
    .from("organizers")
    .select("*")
    .eq("email", input.email)
    .maybeSingle();

  if (emailError) {
    throw emailError;
  }

  if (emailOrganizer) {
    const { data: claimedOrganizer, error: claimError } = await client
      .from("organizers")
      .update({
        auth_user_id: input.userId,
        name: input.name,
      })
      .eq("id", (emailOrganizer as OrganizerRow).id)
      .select("*")
      .single();

    if (claimError) {
      throw claimError;
    }

    return mapOrganizer(claimedOrganizer as OrganizerRow);
  }

  const { data: createdOrganizer, error: createError } = await client
    .from("organizers")
    .insert({
      auth_user_id: input.userId,
      email: input.email,
      name: input.name,
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return mapOrganizer(createdOrganizer as OrganizerRow);
}

export const OrganizerRepository = {
  getCurrent: getCurrentOrganizer,
  getForAuthenticatedUser: getOrganizerForAuthenticatedUser,
  list: listOrganizers,
  mock: mockOrganizer,
};
