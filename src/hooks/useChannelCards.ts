// src/hooks/useChannelCards.ts
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import type { ChannelCard } from '../types/channel';

interface UseChannelCardsResult {
    channels: ChannelCard[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    deleteChannel: (channelId: string) => Promise<void>;
}

const AUDIO_API_BASE =
    import.meta.env.VITE_AUDIO_SCRAPING_API_URL ?? 'http://localhost:8000/api/v1';

export function useChannelCards(): UseChannelCardsResult {
    const [channels, setChannels] = useState<ChannelCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<ChannelCard[]>(`${AUDIO_API_BASE}/channels`);
            const data = response.data;

            // Hide any channels that are already soft-deleted
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
            await axios.delete(
                `${AUDIO_API_BASE}/channels/${encodeURIComponent(channelId)}`
            );

            // Optimistic update – immediately hide the deleted channel
            setChannels(prev => prev.filter(c => c.channelId !== channelId));
        } catch (e) {
            console.error('Failed to delete channel:', e);
            // Re-throw the error so the caller can handle it
            throw e;
        }
    }, []);

    return { channels, loading, error, reload: load, deleteChannel };
}
