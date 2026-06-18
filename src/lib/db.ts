import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não estão configurados.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PinRecord {
  id?: string;
  title: string;
  reflection: string;
  description?: string;
  photo: string;
  created_at?: string;
}

export async function saveMomentToSupabase(pin: PinRecord) {
  const { data, error } = await supabase
    .from("pins")
    .insert({
      title: pin.title,
      reflection: pin.reflection,
      description: pin.description || null,
      photo: pin.photo,
      created_at: pin.created_at ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
