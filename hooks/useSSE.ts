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
  const maxReconnectAttempts = 5;
  const isManuallyClosedRef = useRef(false);
  const mountedRef = useRef(true);

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
  }, []);

  const connect = useCallback(() => {
    // Don't connect if component is unmounted or already connecting
    if (!mountedRef.current || !outletId || eventSourceRef.current) return;

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
        
        if (!isManuallyClosedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
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
          console.log('Max SSE reconnection attempts reached or manually closed');
          setConnectionStatus('disconnected');
        }
      };

    } catch (error) {
      console.error('Error creating SSE connection:', error);
      if (mountedRef.current) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    }
  }, [outletId, onNewOrder, onOrderUpdate, onOrderComplete, onError, onConnect, onDisconnect, cleanup]);

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting SSE');
    cleanup();
    if (mountedRef.current) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [cleanup]);

  const reconnect = useCallback(() => {
    console.log('Manual SSE reconnection requested');
    reconnectAttemptsRef.current = 0;
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
      
      if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CLOSED) {
        console.log('SSE health check detected closed connection');
        setIsConnected(false);
        setConnectionStatus('reconnecting');
        reconnect();
      }
    }, 60000); // Check every minute

    return () => clearInterval(healthCheckInterval);
  }, [isConnected, reconnect]);

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