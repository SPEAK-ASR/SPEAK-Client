import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import chirathImg from '../assets/profiles/chirath.png';
import rusiraImg from '../assets/profiles/rusira.png';
import kokilaImg from '../assets/profiles/kokila.png';
import sahanImg from '../assets/profiles/sahan.png';
import { AdminContext, type AdminName, type AdminProfile, type AdminContextValue } from './context';

const ADMIN_STORAGE_KEY = 'adminName';

const PROFILES: AdminProfile[] = [
  { id: 'chirath', displayName: 'Chirath', imagePath: chirathImg },
  { id: 'rusira', displayName: 'Rusira', imagePath: rusiraImg },
  { id: 'kokila', displayName: 'Kokila', imagePath: kokilaImg },
  { id: 'sahan', displayName: 'Sahan', imagePath: sahanImg },
];

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
