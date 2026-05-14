import { useCallback, useEffect, useState } from "react";
import { speakServerClient } from "../lib/speakServerApi";
import type { ChannelCard } from "../types/channel";

interface UseChannelCardsResult {
  channels: ChannelCard[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
}

export function useChannelCards(): UseChannelCardsResult {
  const [channels, setChannels] = useState<ChannelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await speakServerClient.get<ChannelCard[]>("/channels");
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
    await speakServerClient.delete(
      `/channels/${encodeURIComponent(channelId)}`,
    );
    setChannels((prev) => prev.filter((c) => c.channelId !== channelId));
  }, []);

  return { channels, loading, error, reload: load, deleteChannel };
}
