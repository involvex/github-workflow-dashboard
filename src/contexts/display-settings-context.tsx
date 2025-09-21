'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export const REFRESH_INTERVALS = [
  { value: 10, label: '10 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' }
] as const;

type RefreshInterval = typeof REFRESH_INTERVALS[number]['value'];

interface DisplaySettings {
  compactMode: boolean;
  refreshInterval: RefreshInterval;
  dashboardName: string;
}

interface DisplaySettingsContextType {
  settings: DisplaySettings;
  updateSettings: (updates: Partial<DisplaySettings>) => void;
  toggleCompactMode: () => void;
  setRefreshInterval: (interval: RefreshInterval) => void;
  getRefreshIntervalLabel: (interval: RefreshInterval) => string;
  setDashboardName: (name: string) => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (!context) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
}

interface DisplaySettingsProviderProps {
  children: React.ReactNode;
}

const DEFAULT_SETTINGS: DisplaySettings = {
  compactMode: false,
  refreshInterval: 120, // Default 2 minutes (keeping existing behavior)
  dashboardName: 'GitHub Flow Dashboard'
};

export function DisplaySettingsProvider({ children }: DisplaySettingsProviderProps) {
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('github-flow-dashboard-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load display settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage when they change
  const updateSettings = (updates: Partial<DisplaySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    try {
      localStorage.setItem('github-flow-dashboard-settings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save display settings to localStorage:', error);
    }
  };

  const toggleCompactMode = () => {
    updateSettings({ compactMode: !settings.compactMode });
  };

  const setRefreshInterval = (interval: RefreshInterval) => {
    updateSettings({ refreshInterval: interval });
  };

  const setDashboardName = (name: string) => {
    updateSettings({ dashboardName: name });
  };

  const getRefreshIntervalLabel = (interval: RefreshInterval): string => {
    const found = REFRESH_INTERVALS.find(item => item.value === interval);
    return found?.label || `${interval} seconds`;
  };

  return (
    <DisplaySettingsContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        toggleCompactMode, 
        setRefreshInterval, 
        getRefreshIntervalLabel,
        setDashboardName
      }}
    >
      {children}
    </DisplaySettingsContext.Provider>
  );
}