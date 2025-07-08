'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSSE } from '@/hooks/useSSE';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '@/lib/orderTypes';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

interface OrderSyncState {
  activeOrder: Order | null;
  orderHistory: Order[];
  isLoading: boolean;
  lastSyncTime: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface UseOrderSyncProps {
  outletId: string;
  onOrderUpdate?: (order: Order) => void;
  onOrderComplete?: (order: Order) => void;
}

export function useOrderSync({ outletId, onOrderUpdate, onOrderComplete }: UseOrderSyncProps) {
  const [syncState, setSyncState] = useState<OrderSyncState>({
    activeOrder: null,
    orderHistory: [],
    isLoading: false,
    lastSyncTime: 0,
    connectionStatus: 'disconnected'
  });
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // Storage keys
  const getStorageKeys = useCallback(() => ({
    activeOrder: `activeOrder-${outletId}`,
    orderHistory: `orderHistory-${outletId}`,
    lastSync: `lastSync-${outletId}`,
  }), [outletId]);

  // Load data from localStorage
  const loadFromStorage = useCallback(() => {
    if (!outletId) return { activeOrder: null, orderHistory: [], lastSyncTime: 0 };

    const keys = getStorageKeys();
    try {
      const activeOrderData = localStorage.getItem(keys.activeOrder);
      const historyData = localStorage.getItem(keys.orderHistory);
      const lastSyncData = localStorage.getItem(keys.lastSync);

      const activeOrder = activeOrderData ? JSON.parse(activeOrderData) : null;
      const orderHistory = historyData ? JSON.parse(historyData) : [];
      const lastSyncTime = lastSyncData ? parseInt(lastSyncData) : 0;

      if (mountedRef.current) {
        setSyncState(prev => ({
          ...prev,
          activeOrder,
          orderHistory,
          lastSyncTime
        }));
      }

      return { activeOrder, orderHistory, lastSyncTime };
    } catch (error) {
      console.error('Error loading from storage:', error);
      return { activeOrder: null, orderHistory: [], lastSyncTime: 0 };
    }
  }, [getStorageKeys, outletId]);

  // Save data to localStorage
  const saveToStorage = useCallback((data: Partial<OrderSyncState>) => {
    if (!outletId) return;

    const keys = getStorageKeys();
    try {
      if (data.activeOrder !== undefined) {
        if (data.activeOrder) {
          localStorage.setItem(keys.activeOrder, JSON.stringify(data.activeOrder));
        } else {
          localStorage.removeItem(keys.activeOrder);
        }
      }
      if (data.orderHistory) {
        localStorage.setItem(keys.orderHistory, JSON.stringify(data.orderHistory));
      }
      if (data.lastSyncTime) {
        localStorage.setItem(keys.lastSync, data.lastSyncTime.toString());
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, [getStorageKeys, outletId]);

  // Check if order is completed
  const isOrderCompleted = useCallback((order: Order) => {
    return order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.PAID;
  }, []);

  // Move order to history
  const moveOrderToHistory = useCallback((order: Order) => {
    if (!mountedRef.current) return;

    console.log('Moving order to history:', order.orderId);

    setSyncState(prev => {
      const newHistory = [order, ...prev.orderHistory.filter(h => h.orderId !== order.orderId)];
      const newState = {
        ...prev,
        activeOrder: null,
        orderHistory: newHistory,
        lastSyncTime: Date.now()
      };

      saveToStorage({
        activeOrder: null,
        orderHistory: newHistory,
        lastSyncTime: newState.lastSyncTime
      });

      return newState;
    });

    if (onOrderComplete) {
      onOrderComplete(order);
    }
  }, [saveToStorage, onOrderComplete]);

  // Update active order
  const updateActiveOrder = useCallback((order: Order) => {
    if (!mountedRef.current) return;

    console.log('Updating active order:', order.orderId);

    if (isOrderCompleted(order)) {
      moveOrderToHistory(order);
      return;
    }

    setSyncState(prev => {
      const newState = {
        ...prev,
        activeOrder: order,
        lastSyncTime: Date.now()
      };

      saveToStorage({
        activeOrder: order,
        lastSyncTime: newState.lastSyncTime
      });

      return newState;
    });

    if (onOrderUpdate) {
      onOrderUpdate(order);
    }
  }, [isOrderCompleted, moveOrderToHistory, saveToStorage, onOrderUpdate]);

  // Helper to get current active orderId from storage
  const getCurrentActiveOrderId = useCallback(() => {
    const keys = getStorageKeys();
    const activeOrderData = localStorage.getItem(keys.activeOrder);
    if (activeOrderData) {
      try {
        const order = JSON.parse(activeOrderData);
        return order?.orderId;
      } catch {
        return null;
      }
    }
    return null;
  }, [getStorageKeys]);

  // SSE event handlers
  const handleNewOrder = useCallback((order: Order) => {
    const currentOrderId = getCurrentActiveOrderId();
    if (order.orderId !== currentOrderId) return;
    console.log('New order received:', order.orderId);
    updateActiveOrder(order);
  }, [updateActiveOrder, getCurrentActiveOrderId]);

  const handleOrderUpdate = useCallback((order: Order) => {
    const currentOrderId = getCurrentActiveOrderId();
    if (order.orderId !== currentOrderId) return;
    console.log('Order update received:', order.orderId);
    updateActiveOrder(order);
  }, [updateActiveOrder, getCurrentActiveOrderId]);

  const handleOrderComplete = useCallback((order: Order) => {
    const currentOrderId = getCurrentActiveOrderId();
    if (order.orderId !== currentOrderId) return;
    console.log('Order completion received:', order.orderId);
    moveOrderToHistory(order);
  }, [moveOrderToHistory, getCurrentActiveOrderId]);

  const handleSSEConnect = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('SSE connected');
    setSyncState(prev => ({ ...prev, connectionStatus: 'connected' }));
  }, []);

  const handleSSEDisconnect = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('SSE disconnected');
    setSyncState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
  }, []);

  const handleSSEError = useCallback((error: string) => {
    console.error('SSE error:', error);
  }, []);

  // Initialize SSE connection only if outletId is valid
  const { isConnected, connectionStatus, reconnect: sseReconnect } = useSSE({
    outletId: outletId && outletId.length === 24 ? outletId : undefined, // Only connect if valid ObjectId
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    onOrderComplete: handleOrderComplete,
    onConnect: handleSSEConnect,
    onDisconnect: handleSSEDisconnect,
    onError: handleSSEError
  });

  // Update connection status from SSE
  useEffect(() => {
    if (mountedRef.current) {
      setSyncState(prev => ({ ...prev, connectionStatus }));
    }
  }, [connectionStatus]);

  // Fetch order data from server
  const fetchOrderData = useCallback(async (orderId?: string) => {
    if (!orderId && !syncState.activeOrder) return;

    const targetOrderId = orderId || syncState.activeOrder?.orderId;
    if (!targetOrderId || !mountedRef.current) return;

    setSyncState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Fetching order data for:', targetOrderId);
      const response = await axios.get(`/api/orders/${targetOrderId}`);
      const order = response.data.order;

      if (order && mountedRef.current) {
        updateActiveOrder(order);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        setHasNetworkError(true);
        toast({
          title: 'Connection lost, please reload page',
          description: '',
          variant: 'destructive',
        });
      }
      console.error('Error fetching order data:', error);
      // If order not found, it might have been completed
      if (axios.isAxiosError(error) && error.response?.status === 404 && mountedRef.current) {
        setSyncState(prev => {
          saveToStorage({ activeOrder: null });
          return { ...prev, activeOrder: null };
        });
      }
    } finally {
      if (mountedRef.current) {
        setSyncState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [syncState.activeOrder, updateActiveOrder, saveToStorage]);

  // Load initial data from storage
  useEffect(() => {
    mountedRef.current = true;
    loadFromStorage();

    return () => {
      mountedRef.current = false;
    };
  }, [loadFromStorage]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Public methods
  const createOrder = useCallback(async (orderData: {
    items: OrderItem[];
    totalAmount: number;
    comments?: string;
    customerName?: string;
    tableNumber?: string;
  }) => {
    if (!mountedRef.current) return;

    try {
      setSyncState(prev => ({ ...prev, isLoading: true }));

      const response = await axios.post('/api/orders', {
        ...orderData,
        outletId
      });

      const newOrder = response.data.order;
      console.log('Order created:', newOrder.orderId);

      // The SSE stream will automatically pick up this new order
      // No need to manually emit events like with Socket.IO
      if (mountedRef.current) {
        updateActiveOrder(newOrder);
      }
      return newOrder;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        setHasNetworkError(true);
        toast({
          title: 'Connection lost, please reload page',
          description: '',
          variant: 'destructive',
        });
      }
      console.error('Error creating order:', error);
      throw error;
    } finally {
      if (mountedRef.current) {
        setSyncState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [outletId, updateActiveOrder]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    if (!mountedRef.current) return;

    try {
      setSyncState(prev => ({ ...prev, isLoading: true }));

      const response = await axios.put(`/api/orders/${orderId}`, updates);
      const updatedOrder = response.data.order;

      console.log('Order updated:', updatedOrder.orderId);

      // The SSE stream will automatically pick up this update
      // No need to manually emit events like with Socket.IO
      if (mountedRef.current) {
        updateActiveOrder(updatedOrder);
      }
      return updatedOrder;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
        setHasNetworkError(true);
        toast({
          title: 'Connection lost, please reload page',
          description: '',
          variant: 'destructive',
        });
      }
      console.error('Error updating order:', error);
      throw error;
    } finally {
      if (mountedRef.current) {
        setSyncState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [updateActiveOrder]);

  const refreshOrder = useCallback(() => {
    if (!mountedRef.current) return;

    if (syncState.activeOrder) {
      fetchOrderData(syncState.activeOrder.orderId);
    } else {
      // Try to reconnect SSE
      sseReconnect();
    }
  }, [syncState.activeOrder, fetchOrderData, sseReconnect]);

  const clearActiveOrder = useCallback(() => {
    if (!mountedRef.current) return;

    setSyncState(prev => {
      saveToStorage({ activeOrder: null });
      return { ...prev, activeOrder: null };
    });
  }, [saveToStorage]);

  return {
    // State
    activeOrder: syncState.activeOrder,
    orderHistory: syncState.orderHistory,
    isLoading: syncState.isLoading,
    connectionStatus: syncState.connectionStatus,
    isConnected,
    hasNetworkError,

    // Methods
    createOrder,
    updateOrder,
    refreshOrder,
    clearActiveOrder,

    // Utils
    isOrderCompleted,
    lastSyncTime: syncState.lastSyncTime
  };
}

export const dynamic = "force-dynamic";