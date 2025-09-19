'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppConfig, getConfig } from '@/config';

interface ConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  isLoading: true,
  error: null,
});

export const useConfig = () => useContext(ConfigContext);

interface ConfigProviderProps {
  children: React.ReactNode;
}

export default function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const appConfig = await getConfig();
        setConfig(appConfig);
      } catch (err) {
        console.error('Failed to load application configuration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load application configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}