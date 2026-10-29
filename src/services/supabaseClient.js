import { createClient } from "@supabase/supabase-js";
import { demoClient } from "./demoClient";

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
export const SUPABASE_PUBLIC_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""
).trim();

const url = SUPABASE_URL;
const key = SUPABASE_PUBLIC_KEY;
let client = null;
let error = "";
try {
  if (url || key) {
    if (!/^https:\/\/[a-z0-9.-]+\/?$/i.test(url) || !key)
      throw new Error("Completa la URL https");
    if (key.startsWith("sb_secret_")) throw new Error("Clave anon incorrecta");
    if (key.split(".").length === 3) {
      const payload = JSON.parse(
        atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      if (payload.role === "service_role")
        throw new Error("Clave anon incorrecta");
    }
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
} catch (e) {
  error = e.message;
}
export const configurationError = error;
export const isDemo = !client;
export const supabase = client || demoClient;
