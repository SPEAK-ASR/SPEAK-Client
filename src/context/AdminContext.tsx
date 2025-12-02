import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AdminName = 'chirath' | 'rusira' | 'kokila' | 'sahan';

export interface AdminProfile {
  id: AdminName;
  displayName: string;
  imagePath: string;
}

const ADMIN_STORAGE_KEY = 'adminName';

const PROFILES: AdminProfile[] = [
  { id: 'chirath', displayName: 'Chirath', imagePath: '/src/assets/profiles/chirath.png' },
  { id: 'rusira', displayName: 'Rusira', imagePath: '/src/assets/profiles/rusira.png' },
  { id: 'kokila', displayName: 'Kokila', imagePath: '/src/assets/profiles/kokila.png' },
  { id: 'sahan', displayName: 'Sahan', imagePath: '/src/assets/profiles/sahan.png' },
];

interface AdminContextValue {
  admin: AdminName | null;
  profiles: AdminProfile[];
  isAdmin: boolean;
  isSelectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  selectAdmin: (admin: AdminName) => void;
  clearAdmin: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminName | null>(null);
  const [isSelectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY) as AdminName | null;
    if (saved && PROFILES.some(profile => profile.id === saved)) {
      setAdmin(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'Backquote') {
        event.preventDefault();
        setSelectorOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectAdmin = useCallback((next: AdminName) => {
    setAdmin(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, next);
    }
    setSelectorOpen(false);
  }, []);

  const clearAdmin = useCallback(() => {
    setAdmin(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }, []);

  const openSelector = useCallback(() => setSelectorOpen(true), []);
  const closeSelector = useCallback(() => setSelectorOpen(false), []);

  const value = useMemo<AdminContextValue>(() => ({
    admin,
    profiles: PROFILES,
    isAdmin: Boolean(admin),
    isSelectorOpen,
    openSelector,
    closeSelector,
    selectAdmin,
    clearAdmin,
  }), [admin, isSelectorOpen, openSelector, closeSelector, selectAdmin, clearAdmin]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return ctx;
}

export function getAdminDisplayName(id: AdminName | null | undefined) {
  if (!id) return '';
  const profile = PROFILES.find(p => p.id === id);
  return profile?.displayName ?? id;
}
