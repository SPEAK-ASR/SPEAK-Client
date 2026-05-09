import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

export interface ServiceStatus {
  name: string;
  url: string;
  port: number;
  isOnline: boolean;
  lastChecked: Date | null;
  responseTime?: number;
}

const AUDIO_SERVICE_URL =
  import.meta.env.VITE_AUDIO_BASE_URL || "http://localhost:8000";
const TRANSCRIPTION_SERVICE_URL =
  import.meta.env.VITE_TRANSCRIPTION_BASE_URL || "http://localhost:5000";

const initialServices: ServiceStatus[] = [
  {
    name: "Audio Scraping",
    url: AUDIO_SERVICE_URL,
    port: 8000,
    isOnline: false,
    lastChecked: null,
  },
  {
    name: "Transcription",
    url: TRANSCRIPTION_SERVICE_URL,
    port: 5000,
    isOnline: false,
    lastChecked: null,
  },
];

export function useServiceStatus() {
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [loading, setLoading] = useState(false);
  const ref = useRef(services);

  useEffect(() => {
    ref.current = services;
  }, [services]);

  const checkOne = async (s: ServiceStatus): Promise<ServiceStatus> => {
    const start = Date.now();
    try {
      const res = await axios.get(`${s.url}/health`, { timeout: 5000 });
      return {
        ...s,
        isOnline: res.status === 200 && res.data?.status === "healthy",
        lastChecked: new Date(),
        responseTime: Date.now() - start,
      };
    } catch {
      return {
        ...s,
        isOnline: false,
        lastChecked: new Date(),
        responseTime: undefined,
      };
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const updated = await Promise.all(
        ref.current.map((s) => checkOne(s)),
      );
      setServices(updated);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    services,
    loading,
    refresh,
    allOnline: services.every((s) => s.isOnline),
    anyOffline: services.some((s) => !s.isOnline),
  };
}
