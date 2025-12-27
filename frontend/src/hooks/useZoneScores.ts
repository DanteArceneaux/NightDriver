import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ZonesResponse } from '../types';
import { fetchZones } from '../lib/api';
import { showSurgeNotification } from '../lib/notifications';

export function useZoneScores(useWebSocket: boolean = true) {
  const [data, setData] = useState<ZonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

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

    if (!useWebSocket) {
      // Fallback to polling if WebSocket disabled
      const interval = setInterval(loadData, 300000); // 5 minutes
      return () => clearInterval(interval);
    }

    // Connect to WebSocket
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket error:', err);
      setError('Real-time connection failed. Using cached data.');
      setConnected(false);
    });

    // Listen for score updates
    newSocket.on('scores:update', (newData: ZonesResponse) => {
      setData(newData);
      setLoading(false);
    });

    // Listen for surge alerts
    newSocket.on('surge:alert', (surges: any[]) => {
      surges.forEach((surge) => {
        showSurgeNotification(surge);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [useWebSocket, loadData]);

  return { 
    data, 
    loading, 
    error, 
    connected,
    refresh: loadData,
    socket,
  };
}

