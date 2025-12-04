import { useState, useEffect } from 'react';
import axios from 'axios';

export interface ServiceStatus {
  name: string;
  url: string;
  port: number;
  isOnline: boolean;
  lastChecked: Date | null;
  responseTime?: number;
}

const AUDIO_SERVICE_URL = import.meta.env.VITE_AUDIO_BASE_URL || 'http://localhost:8000';
const TRANSCRIPTION_SERVICE_URL = import.meta.env.VITE_TRANSCRIPTION_BASE_URL || 'http://localhost:5000';

export const useServiceStatus = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Audio Scraping',
      url: AUDIO_SERVICE_URL,
      port: 8000,
      isOnline: false,
      lastChecked: null,
    },
    {
      name: 'Transcription',
      url: TRANSCRIPTION_SERVICE_URL,
      port: 5000,
      isOnline: false,
      lastChecked: null,
    },
  ]);

  const checkService = async (service: ServiceStatus): Promise<ServiceStatus> => {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${service.url}/health`, {
        timeout: 5000,
      });
      const responseTime = Date.now() - startTime;
      
      return {
        ...service,
        isOnline: response.status === 200 && response.data.status === 'healthy',
        lastChecked: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        ...service,
        isOnline: false,
        lastChecked: new Date(),
        responseTime: undefined,
      };
    }
  };

  const checkAllServices = async () => {
    const updatedServices = await Promise.all(
      services.map(service => checkService(service))
    );
    setServices(updatedServices);
  };

  useEffect(() => {
    // Check immediately on mount
    checkAllServices();
  }, []);

  return {
    services,
    refresh: checkAllServices,
    allOnline: services.every(s => s.isOnline),
    anyOffline: services.some(s => !s.isOnline),
  };
};
