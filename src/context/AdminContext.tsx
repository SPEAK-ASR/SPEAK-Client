import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import chirathImg from "../assets/profiles/chirath.png";
import rusiraImg from "../assets/profiles/rusira.png";
import kokilaImg from "../assets/profiles/kokila.png";
import sahanImg from "../assets/profiles/sahan.png";
import {
  AdminContext,
  type AdminContextValue,
  type AdminName,
  type AdminProfile,
} from "./context";

const ADMIN_STORAGE_KEY = "adminName";

export const ADMIN_PROFILES: AdminProfile[] = [
  { id: "chirath", displayName: "Chirath", imagePath: chirathImg },
  { id: "rusira", displayName: "Rusira", imagePath: rusiraImg },
  { id: "kokila", displayName: "Kokila", imagePath: kokilaImg },
  { id: "sahan", displayName: "Sahan", imagePath: sahanImg },
];

export function getAdminDisplayName(id: AdminName | null | undefined): string {
  if (!id) return "";
  return ADMIN_PROFILES.find((p) => p.id === id)?.displayName ?? id;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminName | null>(null);
  const [isSelectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(
      ADMIN_STORAGE_KEY,
    ) as AdminName | null;
    if (saved && ADMIN_PROFILES.some((p) => p.id === saved)) {
      setAdmin(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Backquote") {
        e.preventDefault();
        setSelectorOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectAdmin = useCallback((next: AdminName) => {
    setAdmin(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, next);
    }
    setSelectorOpen(false);
  }, []);

  const clearAdmin = useCallback(() => {
    setAdmin(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }, []);

  const openSelector = useCallback(() => setSelectorOpen(true), []);
  const closeSelector = useCallback(() => setSelectorOpen(false), []);

  const value = useMemo<AdminContextValue>(
    () => ({
      admin,
      profiles: ADMIN_PROFILES,
      isAdmin: Boolean(admin),
      isSelectorOpen,
      openSelector,
      closeSelector,
      selectAdmin,
      clearAdmin,
    }),
    [
      admin,
      isSelectorOpen,
      openSelector,
      closeSelector,
      selectAdmin,
      clearAdmin,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
