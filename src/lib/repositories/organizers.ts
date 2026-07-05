import { supabase } from "@/lib/supabase/client";
import type { Organizer } from "@/types/domain";

type OrganizerRow = {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  created_at: string;
};

export const mockOrganizer: Organizer = {
  id: "mock-organizer-dr-michael-nogler",
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

export const OrganizerRepository = {
  getCurrent: getCurrentOrganizer,
  list: listOrganizers,
  mock: mockOrganizer,
};
