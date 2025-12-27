import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ZonesResponse, SurgeAlert } from '../types';
import { fetchZones, BACKEND_URL } from '../lib/api';

export function useZoneScores() {
  const [data, setData] = useState<ZonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data via HTTP (fallback or initial load)
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchZones();
      setData(result);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  }, []);

  // Start fallback polling (when WebSocket is down)
  const startFallbackPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    
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
    // Initial HTTP load
    loadData();

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
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      setError(null);
      stopFallbackPolling();
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
      startFallbackPolling();
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ WebSocket connection error:', err.message);
      setConnected(false);
      startFallbackPolling();
    });

    // Data events
    socket.on('scores:update', (payload: ZonesResponse) => {
      console.log('📊 Received scores update via WebSocket');
      setData(payload);
      setLastUpdate(new Date());
      setError(null);
    });

    socket.on('surge:alert', (alert: SurgeAlert) => {
      console.log('🚨 Surge alert:', alert);
      // Trigger browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Surge Alert!', {
          body: `${alert.zoneName}: ${alert.multiplier}x surge`,
          icon: '/icon.png',
        });
      }
      
      // Also refresh data to get latest surge info
      loadData();
    });

    // Cleanup
    return () => {
      console.log('🔌 Disconnecting WebSocket');
      socket.disconnect();
      stopFallbackPolling();
    };
  }, [loadData, startFallbackPolling, stopFallbackPolling]);

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
