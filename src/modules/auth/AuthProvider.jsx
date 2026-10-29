import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../../services/supabaseClient.js";
import {
  LOCAL_ADMIN,
  hasLocalAdminSession,
  isLocalAdminCredentials,
  localAdminProfile,
  localAdminUser,
  startLocalAdmin,
  stopLocalAdmin,
} from "../../services/localAdmin.js";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [profile, setProfile] = useState({
    id: null,
    data: null,
    role: null,
    error: "",
    loading: false,
  });
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const refreshProfile = () => setRevision((v) => v + 1);

  useEffect(() => {
    let active = true,
      eventSeen = false;
    // Sesión local de administrador (no pasa por Supabase Auth).
    if (hasLocalAdminSession()) {
      setUser(localAdminUser());
      setSessionReady(true);
    }
    // No consultas asíncronas dentro del callback de autenticación.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (hasLocalAdminSession()) {
        setUser(localAdminUser());
        setSessionError("");
        setSessionReady(true);
        return;
      }
      eventSeen = true;
      setUser(session?.user ?? null);
      setSessionError("");
      setSessionReady(true);
    });
    const timer = setTimeout(() => {
      if (active && !eventSeen && !hasLocalAdminSession()) {
        setSessionError("La sesión tardó demasiado. Reintenta la conexión.");
        setSessionReady(true);
      }
    }, 15000);
    if (!hasLocalAdminSession()) {
      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!active || eventSeen || hasLocalAdminSession()) return;
          clearTimeout(timer);
          if (error) setSessionError(error.message);
          setUser(data?.session?.user ?? null);
          setSessionReady(true);
        })
        .catch((error) => {
          if (active && !eventSeen) {
            clearTimeout(timer);
            setSessionError(error.message);
            setSessionReady(true);
          }
        });
    }
    return () => {
      active = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (userId === LOCAL_ADMIN.id && hasLocalAdminSession()) {
      setProfile({
        id: userId,
        data: localAdminProfile(),
        role: LOCAL_ADMIN.rol,
        error: "",
        loading: false,
      });
      return;
    }
    const request = ++generation.current;
    const controller = new AbortController();
    let timedOut = false;
    if (!userId) {
      setProfile({
        id: null,
        data: null,
        role: null,
        error: "",
        loading: false,
      });
      return () => controller.abort();
    }
    setProfile((old) => ({
      id: userId,
      data: old.id === userId ? old.data : null,
      role: old.id === userId ? old.role : null,
      error: "",
      loading: true,
    }));
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    const query = (table) =>
      supabase
        .from(table)
        .select("*")
        .eq("id", userId)
        .abortSignal(controller.signal)
        .maybeSingle();
    async function load() {
      try {
        const employee = await query("empleados");
        if (employee.error) throw employee.error;
        let data = employee.data,
          role = data ? (data.estado === false ? "inactivo" : data.rol) : null;
        if (!data) {
          const client = await query("clientes");
          if (client.error) throw client.error;
          data = client.data;
          role = data ? "cliente" : "sin_perfil";
        }
        if (request === generation.current && !controller.signal.aborted)
          setProfile({ id: userId, data, role, error: "", loading: false });
      } catch (error) {
        if (
          request === generation.current &&
          (!controller.signal.aborted || timedOut)
        )
          setProfile({
            id: userId,
            data: null,
            role: null,
            error: timedOut
              ? "No se pudo cargar el perfil a tiempo. Reintenta."
              : error.message,
            loading: false,
          });
      } finally {
        clearTimeout(timer);
      }
    }
    load();
    return () => {
      ++generation.current;
      clearTimeout(timer);
      controller.abort();
    };
  }, [userId, revision]);

  const login = async (email, password) => {
    if (isLocalAdminCredentials(email, password)) {
      startLocalAdmin();
      const localUser = localAdminUser();
      setUser(localUser);
      setSessionError("");
      setSessionReady(true);
      return { user: localUser };
    }
    stopLocalAdmin();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  };
  const logout = async () => {
    if (hasLocalAdminSession()) {
      stopLocalAdmin();
      try {
        await supabase.auth.signOut();
      } catch {
        // No había sesión real de Supabase: se ignora.
      }
      setUser(null);
      setProfile({
        id: null,
        data: null,
        role: null,
        error: "",
        loading: false,
      });
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };
  const isCurrent = profile.id === userId;
  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile: isCurrent ? profile.data : null,
        userRole: isCurrent ? profile.role : null,
        loading:
          !sessionReady ||
          (!!userId && (!isCurrent || (profile.loading && !profile.data))),
        refreshing: isCurrent && profile.loading,
        authError: sessionError || (isCurrent ? profile.error : ""),
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth necesita AuthProvider");
  return context;
}
