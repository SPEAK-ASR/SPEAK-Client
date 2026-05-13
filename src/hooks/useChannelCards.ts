import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { ChannelCard } from "../types/channel";

interface UseChannelCardsResult {
  channels: ChannelCard[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
}

const SPEAK_SERVER_API_BASE =
  import.meta.env.VITE_SPEAK_SERVER_API_URL ??
  "http://localhost:5000/api/v1";

export function useChannelCards(): UseChannelCardsResult {
  const [channels, setChannels] = useState<ChannelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<ChannelCard[]>(
        `${SPEAK_SERVER_API_BASE}/channels`,
      );
      setChannels(res.data.filter((c) => !c.isDeleted));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteChannel = useCallback(async (channelId: string) => {
    await axios.delete(
      `${SPEAK_SERVER_API_BASE}/channels/${encodeURIComponent(channelId)}`,
    );
    setChannels((prev) => prev.filter((c) => c.channelId !== channelId));
  }, []);

  return { channels, loading, error, reload: load, deleteChannel };
}
