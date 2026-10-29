import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../services/supabaseClient.js";
export default function useRemote(loader, tables = []) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const alive = useRef(false),
    request = useRef(0);
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false);
  const key = tables.join(",");
  const reload = useCallback(async () => {
    const version = ++request.current;
    if (alive.current) setRefreshing(true);
    let timeout;
    try {
      const result = await Promise.race([
        loaderRef.current(),
        new Promise((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new Error("La consulta tardó demasiado. Reintenta la conexión.")
              ),
            20000
          );
        }),
      ]);
      if (alive.current && version === request.current) {
        setData(result);
        setError("");
      }
    } catch (e) {
      if (alive.current && version === request.current)
        setError(e.message || "No se pudo consultar.");
    } finally {
      clearTimeout(timeout);
      if (alive.current && version === request.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    reload();
    // Respaldo si Realtime no está habilitado en el proyecto existente.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") reload();
    }, 30000);
    const focus = () => reload();
    window.addEventListener("focus", focus);
    let timer;
    let channel;
    if (key) {
      channel = supabase.channel(
        `restaurant-${Math.random().toString(36).slice(2)}`
      );
      key.split(",").forEach((table) =>
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            clearTimeout(timer);
            timer = setTimeout(reload, 250);
          }
        )
      );
      channel.subscribe();
    }
    return () => {
      alive.current = false;
      ++request.current;
      clearInterval(interval);
      clearTimeout(timer);
      window.removeEventListener("focus", focus);
      if (channel) supabase.removeChannel(channel);
    };
  }, [key, reload]);
  return { data, error, loading, refreshing, reload };
}
