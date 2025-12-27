import { useState, useEffect, useCallback } from 'react';
import { ZonesResponse } from '../types';
import { fetchZones } from '../lib/api';

export function useZoneScores() {
  const [data, setData] = useState<ZonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected] = useState(true); // Always "connected" for serverless

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchZones();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadData();

    // Poll every 5 minutes for updates
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, [loadData]);

  return { 
    data, 
    loading, 
    error, 
    connected,
    refresh: loadData,
    socket: null,
  };
}

