// src/hooks/useChannelCards.ts
import { useEffect, useState, useCallback } from 'react';
import type { ChannelCard } from '../types/channel';

interface UseChannelCardsResult {
    channels: ChannelCard[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    deleteChannel: (channelId: string) => Promise<void>;
}

// From .env (e.g. http://localhost:8000/api/v1)
const AUDIO_API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export function useChannelCards(): UseChannelCardsResult {
    const [channels, setChannels] = useState<ChannelCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${AUDIO_API_BASE}/channels`);
            if (!res.ok) {
                throw new Error(`Failed to fetch channels: ${res.status}`);
            }
            const data = (await res.json()) as ChannelCard[];

            // 🔑 Hide any channels that are already soft-deleted
            const visible = data.filter(ch => !ch.isDeleted);
            setChannels(visible);
        } catch (e: any) {
            console.error(e);
            setError(e.message ?? 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const deleteChannel = useCallback(async (channelId: string) => {
        try {
            const res = await fetch(
                `${AUDIO_API_BASE}/channels/${encodeURIComponent(channelId)}`,
                { method: 'DELETE' }
            );
            if (!res.ok && res.status !== 204) {
                throw new Error(`Failed to delete channel: ${res.status}`);
            }

            // Optimistic update – immediately hide the deleted channel
            setChannels(prev => prev.filter(c => c.channelId !== channelId));
        } catch (e) {
            console.error(e);
            // optional: surface a toast/snackbar here
        }
    }, []);

    return { channels, loading, error, reload: load, deleteChannel };
}
