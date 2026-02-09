import { createContext } from "react";

export type AdminName = "chirath" | "rusira" | "kokila" | "sahan";

export interface AdminProfile {
    id: AdminName;
    displayName: string;
    imagePath: string;
}

export interface AdminContextValue {
    admin: AdminName | null;
    profiles: AdminProfile[];
    isAdmin: boolean;
    isSelectorOpen: boolean;
    openSelector: () => void;
    closeSelector: () => void;
    selectAdmin: (admin: AdminName) => void;
    clearAdmin: () => void;
}

export const AdminContext = createContext<AdminContextValue | undefined>(
    undefined,
);
