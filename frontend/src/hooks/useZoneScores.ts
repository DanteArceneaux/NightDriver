import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ZonesResponse, SurgeAlert } from '../types';
import { fetchZones, BACKEND_URL, isStaticHost } from '../lib/api';
import { handleError, logError } from '../lib/errors';

export function useZoneScores() {
  const [data, setData] = useState<ZonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Load data via HTTP (fallback or initial load)
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      const result = await fetchZones();
      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = handleError(err);
        setError(error.message);
        setLoading(false);
        logError(error, 'useZoneScores.loadData');
      }
    }
  }, []);

  // Start fallback polling (when WebSocket is down)
  const startFallbackPolling = useCallback(() => {
    if (pollIntervalRef.current || !isMountedRef.current) return;
    
    console.log('🔄 Starting fallback polling (30s interval)');
    pollIntervalRef.current = setInterval(loadData, 30000);
  }, [loadData]);

  // Stop fallback polling (when WebSocket connects)
  const stopFallbackPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      console.log('⏸️ Stopping fallback polling');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial HTTP load
    loadData();

    // On static hosts, skip WebSocket entirely - just use polling for mock data
    if (isStaticHost && !import.meta.env.VITE_BACKEND_URL) {
      console.log('📦 Static host detected - using mock data with polling');
      startFallbackPolling();
      return () => {
        isMountedRef.current = false;
        stopFallbackPolling();
      };
    }

    // Attempt WebSocket connection
    console.log('🔌 Connecting to WebSocket:', BACKEND_URL);
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection events
    const handleConnect = () => {
      if (!isMountedRef.current) return;
      console.log('✅ WebSocket connected');
      setConnected(true);
      setError(null);
      stopFallbackPolling();
    };

    const handleDisconnect = (reason: string) => {
      if (!isMountedRef.current) return;
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
      startFallbackPolling();
    };

    const handleConnectError = (err: Error) => {
      if (!isMountedRef.current) return;
      console.warn('⚠️ WebSocket connection error:', err.message);
      setConnected(false);
      startFallbackPolling();
    };

    const handleScoresUpdate = (payload: ZonesResponse) => {
      if (!isMountedRef.current) return;
      console.log('📊 Received scores update via WebSocket');
      setData(payload);
      setLastUpdate(new Date());
      setError(null);
    };

    const handleSurgeAlert = (alert: SurgeAlert) => {
      if (!isMountedRef.current) return;
      console.log('🚨 Surge alert:', alert);
      // Trigger browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Surge Alert!', {
          body: `${alert.zoneName}: ${alert.multiplier}x surge`,
          icon: '/icon.svg',
        });
      }
      
      // Also refresh data to get latest surge info
      loadData();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('scores:update', handleScoresUpdate);
    socket.on('surge:alert', handleSurgeAlert);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      console.log('🔌 Disconnecting WebSocket');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('scores:update', handleScoresUpdate);
      socket.off('surge:alert', handleSurgeAlert);
      socket.disconnect();
      stopFallbackPolling();
    };
  }, []); // Empty dependency array - stable references

  return { 
    data, 
    loading, 
    error, 
    connected,
    lastUpdate,
    refresh: loadData,
    socket: socketRef.current,
  };
}
