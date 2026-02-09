import { useState, useCallback } from "react";
import type { SnackbarState, SnackbarSeverity } from "../types/common";

/**
 * Custom hook for managing snackbar/notification state
 * Provides consistent notification handling across the application
 */
export function useSnackbar() {
    const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

    const showSnackbar = useCallback(
        (message: string, severity: SnackbarSeverity = "info") => {
            setSnackbar({ message, severity });
        },
        [],
    );

    const showSuccess = useCallback((message: string) => {
        setSnackbar({ message, severity: "success" });
    }, []);

    const showError = useCallback((message: string) => {
        setSnackbar({ message, severity: "error" });
    }, []);

    const showInfo = useCallback((message: string) => {
        setSnackbar({ message, severity: "info" });
    }, []);

    const showWarning = useCallback((message: string) => {
        setSnackbar({ message, severity: "warning" });
    }, []);

    const closeSnackbar = useCallback(() => {
        setSnackbar(null);
    }, []);

    return {
        snackbar,
        showSnackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        closeSnackbar,
    };
}

export type UseSnackbarReturn = ReturnType<typeof useSnackbar>;
