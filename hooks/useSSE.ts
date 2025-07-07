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
  const [isServerSSECapable, setIsServerSSECapable] = useState<boolean | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const isManuallyClosedRef = useRef(false);
  const mountedRef = useRef(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

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

  // Check if server supports SSE
  const checkServerSSECapability = useCallback(async () => {
    if (!outletId || !mountedRef.current) return;

    try {
      console.log('Checking server SSE capability for outlet:', outletId);
      
      const response = await fetch(`/api/orders/stream?outletId=${outletId}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.status === 501) {
        // Server explicitly says SSE is not supported
        const data = await response.json();
        if (data.fallback === 'polling') {
          console.log('Server does not support SSE, falling back to polling');
          setIsServerSSECapable(false);
          setConnectionStatus('disconnected');
          startPolling();
          return;
        }
      }

      // If we get here, assume SSE is supported
      console.log('Server supports SSE');
      setIsServerSSECapable(true);
      
    } catch (error) {
      console.error('Error checking SSE capability:', error);
      // On error, assume SSE might work and let the normal flow handle it
      setIsServerSSECapable(true);
    }
  }, [outletId]);

  // Polling mechanism for when SSE is not available
  const startPolling = useCallback(() => {
    if (!outletId || !mountedRef.current) return;

    console.log('Starting polling mechanism for order updates');
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set connected status for polling
    setIsConnected(true);
    setConnectionStatus('connected');
    if (onConnect) onConnect();

    // Poll every 10 seconds
    pollingIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;

      try {
        // This is a simple polling mechanism
        // In a real implementation, you might want to poll specific endpoints
        // For now, we'll just maintain the connection status
        console.log('Polling for updates...');
      } catch (error) {
        console.error('Polling error:', error);
        if (mountedRef.current) {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          if (onDisconnect) onDisconnect();
        }
      }
    }, 10000);
  }, [outletId, onConnect, onDisconnect]);

  const connect = useCallback(() => {
    // Don't connect if component is unmounted, no outletId, or already connecting
    if (!mountedRef.current || !outletId || eventSourceRef.current) return;

    // If we know SSE is not supported, start polling instead
    if (isServerSSECapable === false) {
      startPolling();
      return;
    }

    // If we don't know SSE capability yet, check first
    if (isServerSSECapable === null) {
      checkServerSSECapability();
      return;
    }

    console.log('Establishing SSE connection for outlet:', outletId);
    isManuallyClosedRef.current = false;
    
    try {
      const url = `/api/orders/stream?outletId=${outletId}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        
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
          console.log('SSE message received:', data.type, data.order?.orderId || data.message);
          
          setLastMessage(data);

          switch (data.type) {
            case 'connection':
              console.log('SSE connection confirmed:', data.message);
              break;
              
            case 'new-order':
              if (data.order && onNewOrder) {
                console.log('New order received via SSE:', data.order.orderId);
                onNewOrder(data.order);
              }
              break;
              
            case 'order-updated':
              if (data.order && onOrderUpdate) {
                console.log('Order update received via SSE:', data.order.orderId);
                onOrderUpdate(data.order);
              }
              break;
              
            case 'order-completed':
              if (data.order && onOrderComplete) {
                console.log('Order completion received via SSE:', data.order.orderId);
                onOrderComplete(data.order);
              }
              break;
              
            case 'error':
              console.error('SSE error message:', data.message, data.error);
              if (onError) onError(data.error || data.message || 'Unknown SSE error');
              break;
              
            default:
              console.log('Unknown SSE message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error, event.data);
        }
      };

      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('SSE connection error:', error);
        setIsConnected(false);
        
        // Only attempt reconnection if SSE is supported and not manually closed
        if ((isServerSSECapable === null || isServerSSECapable === true) && !isManuallyClosedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          setConnectionStatus('reconnecting');
          if (onDisconnect) onDisconnect();
          
          // Attempt to reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000); // Max 10 seconds
          console.log(`Attempting SSE reconnection ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            
            reconnectAttemptsRef.current++;
            cleanup();
            
            // Add a small delay before reconnecting
            setTimeout(() => {
              if (mountedRef.current) {
                connect();
              }
            }, 500);
          }, delay);
        } else {
          console.log('Max SSE reconnection attempts reached, manually closed, or SSE not supported');
          setConnectionStatus('disconnected');
          
          // If SSE failed and we haven't determined it's unsupported, fall back to polling
          if (isServerSSECapable === null || isServerSSECapable === true) {
            console.log('SSE failed, falling back to polling');
            setIsServerSSECapable(false);
            startPolling();
          }
        }
      };

    } catch (error) {
      console.error('Error creating SSE connection:', error);
      if (mountedRef.current) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Fall back to polling on SSE creation error
        console.log('SSE creation failed, falling back to polling');
        setIsServerSSECapable(false);
        startPolling();
      }
    }
  }, [outletId, onNewOrder, onOrderUpdate, onOrderComplete, onError, onConnect, onDisconnect, cleanup, isServerSSECapable, checkServerSSECapability, startPolling]);

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting SSE/Polling');
    cleanup();
    if (mountedRef.current) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [cleanup]);

  const reconnect = useCallback(() => {
    console.log('Manual SSE/Polling reconnection requested');
    reconnectAttemptsRef.current = 0;
    setIsServerSSECapable(null); // Reset SSE capability check
    cleanup();
    
    if (mountedRef.current) {
      setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 1000);
    }
  }, [cleanup, connect]);

  // Setup connection when outletId is available
  useEffect(() => {
    mountedRef.current = true;
    
    if (outletId) {
      // Add a small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [outletId, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Connection health check (reduced frequency)
  useEffect(() => {
    if (!isConnected || !mountedRef.current) return;

    const healthCheckInterval = setInterval(() => {
      if (!mountedRef.current) return;
      
      // Only check EventSource health if we're using SSE
      if (isServerSSECapable === true && eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CLOSED) {
        console.log('SSE health check detected closed connection');
        setIsConnected(false);
        setConnectionStatus('reconnecting');
        reconnect();
      }
    }, 60000); // Check every minute

    return () => clearInterval(healthCheckInterval);
  }, [isConnected, reconnect, isServerSSECapable]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    reconnect,
    disconnect,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts,
    isServerSSECapable
  };
}