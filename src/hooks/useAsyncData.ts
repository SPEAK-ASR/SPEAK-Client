import { useState, useCallback, useEffect, useRef } from "react";
import type { AsyncState } from "../types/common";

interface UseAsyncDataOptions<T> {
    /** Initial data value */
    initialData?: T | null;
    /** Whether to fetch immediately on mount */
    immediate?: boolean;
    /** Dependencies that trigger refetch */
    deps?: unknown[];
}

/**
 * Custom hook for managing async data fetching with loading and error states
 * Provides consistent data loading pattern across the application
 */
export function useAsyncData<T>(
    fetcher: () => Promise<T>,
    options: UseAsyncDataOptions<T> = {},
) {
    const { initialData = null, immediate = true, deps = [] } = options;

    const [state, setState] = useState<AsyncState<T>>({
        data: initialData,
        loading: immediate,
        error: null,
    });

    const mountedRef = useRef(true);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const execute = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const data = await fetcherRef.current();
            if (mountedRef.current) {
                setState({ data, loading: false, error: null });
            }
            return data;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An error occurred";
            if (mountedRef.current) {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: errorMessage,
                }));
            }
            throw err;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ data: initialData, loading: false, error: null });
    }, [initialData]);

    const setData = useCallback((data: T | null) => {
        setState((prev) => ({ ...prev, data }));
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        if (immediate) {
            execute().catch(() => {
                // Error is already handled in state
            });
        }

        return () => {
            mountedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return {
        ...state,
        execute,
        refetch: execute,
        reset,
        setData,
        isIdle: !state.loading && !state.error && state.data === null,
    };
}

export type UseAsyncDataReturn<T> = ReturnType<typeof useAsyncData<T>>;
