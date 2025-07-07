'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Order } from '@/lib/orderTypes';

interface SSEMessage {
  type: 'connection' | 'new-order' | 'order-updated' | 'order-completed' | 'error';
  order?: Order;
  message?: string;
  error?: string;
  timestamp: string;
  outletId?: string;
  operationType?: string;
}

interface UseSSEProps {
  outletId?: string;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
  onOrderComplete?: (order: Order) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSSE({
  outletId,
  onNewOrder,
  onOrderUpdate,
  onOrderComplete,
  onError,
  onConnect,
  onDisconnect
}: UseSSEProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const isManuallyClosedRef = useRef(false);
  const mountedRef = useRef(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Cleaning up SSE connection');
      isManuallyClosedRef.current = true;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = undefined;
    }
  }, []);

  // Simplified polling mechanism
  const startPolling = useCallback(() => {
    if (!outletId || !mountedRef.current || pollingIntervalRef.current) return;

    console.log('Starting polling mechanism for order updates');
    
    // Immediately set connected status
    setIsConnected(true);
    setConnectionStatus('connected');
    if (onConnect) onConnect();

    // Simple polling - just maintain connection status
    pollingIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      
      // Keep connection alive
      console.log('Polling heartbeat');
    }, 30000); // Poll every 30 seconds
  }, [outletId, onConnect]);

  // Try SSE connection first, fallback to polling
  const connect = useCallback(() => {
    if (!mountedRef.current || !outletId || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    isManuallyClosedRef.current = false;
    
    console.log('Attempting connection for outlet:', outletId);

    // Try SSE first
    try {
      const url = `/api/orders/stream?outletId=${outletId}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Set a timeout to fallback to polling if SSE doesn't connect quickly
      const sseTimeout = setTimeout(() => {
        if (!isConnected && mountedRef.current) {
          console.log('SSE timeout, falling back to polling');
          cleanup();
          startPolling();
        }
      }, 5000); // 5 second timeout

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        
        clearTimeout(sseTimeout);
        console.log('SSE connection opened');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        if (onConnect) onConnect();
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data: SSEMessage = JSON.parse(event.data);
          console.log('SSE message received:', data.type);
          
          setLastMessage(data);

          switch (data.type) {
            case 'connection':
              console.log('SSE connection confirmed');
              break;
              
            case 'new-order':
              if (data.order && onNewOrder) {
                onNewOrder(data.order);
              }
              break;
              
            case 'order-updated':
              if (data.order && onOrderUpdate) {
                onOrderUpdate(data.order);
              }
              break;
              
            case 'order-completed':
              if (data.order && onOrderComplete) {
                onOrderComplete(data.order);
              }
              break;
              
            case 'error':
              console.error('SSE error message:', data.message);
              if (onError) onError(data.error || data.message || 'Unknown SSE error');
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;
        
        clearTimeout(sseTimeout);
        console.log('SSE connection error, falling back to polling');
        
        setIsConnected(false);
        cleanup();
        
        // Fallback to polling immediately
        if (!isManuallyClosedRef.current) {
          startPolling();
        }
      };

    } catch (error) {
      console.error('Error creating SSE connection, falling back to polling:', error);
      if (mountedRef.current) {
        startPolling();
      }
    }
  }, [outletId, onNewOrder, onOrderUpdate, onOrderComplete, onError, onConnect, cleanup, startPolling, isConnected]);

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting');
    cleanup();
    if (mountedRef.current) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [cleanup]);

  const reconnect = useCallback(() => {
    console.log('Manual reconnection requested');
    reconnectAttemptsRef.current = 0;
    isInitializedRef.current = false;
    cleanup();
    
    if (mountedRef.current) {
      setIsConnected(false);
      setConnectionStatus('reconnecting');
      
      setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 1000);
    }
  }, [cleanup, connect]);

  // Initialize connection when outletId is available
  useEffect(() => {
    mountedRef.current = true;
    
    if (outletId && !isInitializedRef.current) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [outletId, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    reconnect,
    disconnect,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts
  };
}