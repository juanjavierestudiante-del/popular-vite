import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.warn(
      "[vite] Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. " +
        "La app compilará en modo demostración."
    );
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
  };
});
