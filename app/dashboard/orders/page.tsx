'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Clock, User, Hash, MessageSquare, 
  CheckCircle, Loader2, RefreshCw, Wifi, WifiOff,
  ChefHat, Package, CheckSquare, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/DashboardHeader';
import { Order, OrderStatus, PaymentStatus } from '@/lib/orderTypes';
import axios from 'axios';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
}

export default function OrdersPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simple polling for real-time updates (fallback approach)
  useEffect(() => {
    if (!outlet) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [outlet]);

  const fetchData = async () => {
    try {
      const outletResponse = await axios.get('/api/outlets');
      const outletData = outletResponse.data.outlet;
      
      if (!outletData) {
        router.push('/dashboard');
        return;
      }
      
      setOutlet(outletData);
      
      // Fetch orders
      const ordersResponse = await axios.get(`/api/orders?outletId=${outletData._id}`);
      setOrders(ordersResponse.data.orders || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!outlet) return;
    
    try {
      const ordersResponse = await axios.get(`/api/orders?outletId=${outlet._id}`);
      setOrders(ordersResponse.data.orders || []);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching orders:', error);
      setConnectionStatus('disconnected');
    }
  };

  const updateOrderStatus = async (orderId: string, field: 'orderStatus' | 'paymentStatus', value: string) => {
    setIsUpdating(true);
    try {
      const response = await axios.put(`/api/orders/${orderId}`, {
        [field]: value
      });

      const updatedOrder = response.data.order;
      console.log('Order status updated:', updatedOrder);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.orderId === orderId ? updatedOrder : order
      ));
      
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateComments = async (orderId: string, comments: string) => {
    try {
      const response = await axios.put(`/api/orders/${orderId}`, { comments });
      const updatedOrder = response.data.order;
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.orderId === orderId ? updatedOrder : order
      ));
      
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating comments:', error);
    }
  };

  const completeOrder = async (orderId: string) => {
    setIsUpdating(true);
    try {
      const response = await axios.put(`/api/orders/${orderId}`, {
        orderStatus: OrderStatus.SERVED,
        paymentStatus: PaymentStatus.PAID
      });

      const completedOrder = response.data.order;
      console.log('Order completed:', completedOrder);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.orderId === orderId ? completedOrder : order
      ));
      
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(completedOrder);
      }
    } catch (error) {
      console.error('Error completing order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.TAKEN: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.PREPARING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PREPARED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.SERVED: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.UNPAID: return 'bg-red-100 text-red-800 border-red-200';
      case PaymentStatus.PAID: return 'bg-green-100 text-green-800 border-green-200';
      case PaymentStatus.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.TAKEN: return <Clock className="h-4 w-4" />;
      case OrderStatus.PREPARING: return <ChefHat className="h-4 w-4" />;
      case OrderStatus.PREPARED: return <Package className="h-4 w-4" />;
      case OrderStatus.SERVED: return <CheckSquare className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Fixed completion logic - both conditions must be true
  const canCompleteOrder = (order: Order) => {
    return order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.PAID;
  };

  const isOrderCompleted = (order: Order) => {
    return order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.PAID;
  };

  // Check if order can be marked as complete (either served+unpaid OR prepared+paid)
  const canMarkComplete = (order: Order) => {
    return (order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.UNPAID) ||
           (order.orderStatus === OrderStatus.PREPARED && order.paymentStatus === PaymentStatus.PAID);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    if (isMobile) {
      setIsSheetOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Filter orders: show active orders first, then completed ones
  const activeOrders = orders.filter(order => !isOrderCompleted(order));
  const completedOrders = orders.filter(order => isOrderCompleted(order));

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user || !outlet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader outlet={outlet} onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600">Track and manage incoming orders</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-yellow-600 font-medium">Reconnecting</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600 font-medium">Offline</span>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={fetchOrders}
                disabled={isLoading}
                size="sm"
                className="border-gray-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    Active Orders ({activeOrders.length})
                  </CardTitle>
                  <CardDescription>
                    Orders currently being processed
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {activeOrders.map((order, index) => (
                      <div key={order.orderId}>
                        <div
                          onClick={() => handleOrderClick(order)}
                          className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                            selectedOrder?.orderId === order.orderId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(order.orderStatus)}
                                <span className="font-mono text-sm font-semibold">
                                  #{order.orderId.split('-')[1]}
                                </span>
                              </div>
                              <Badge className={`${getStatusColor(order.orderStatus)} border`}>
                                {order.orderStatus}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">₹{order.totalAmount.toFixed(2)}</p>
                              <Badge variant="outline" className={getPaymentColor(order.paymentStatus)}>
                                {order.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-4">
                              {order.customerName && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{order.customerName}</span>
                                </div>
                              )}
                              {order.tableNumber && (
                                <div className="flex items-center space-x-1">
                                  <Hash className="h-3 w-3" />
                                  <span>Table {order.tableNumber}</span>
                                </div>
                              )}
                            </div>
                            <span>{new Date(order.timestamps.created).toLocaleTimeString()}</span>
                          </div>
                          
                          {/* Item summary */}
                          <div className="flex flex-wrap gap-1">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {item.quantity}x {item.name}
                              </Badge>
                            ))}
                            {order.items.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{order.items.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        {index < activeOrders.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Completed Orders ({completedOrders.length})
                  </CardTitle>
                  <CardDescription>
                    Recently completed orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {completedOrders.slice(0, 10).map((order, index) => (
                      <div key={order.orderId}>
                        <div
                          onClick={() => handleOrderClick(order)}
                          className={`p-4 cursor-pointer transition-all hover:bg-gray-50 opacity-75 ${
                            selectedOrder?.orderId === order.orderId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-mono text-sm font-semibold">
                                #{order.orderId.split('-')[1]}
                              </span>
                              <Badge className="bg-green-100 text-green-800 border-green-200 border">
                                Completed
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₹{order.totalAmount.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              {order.customerName && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{order.customerName}</span>
                                </div>
                              )}
                              {order.tableNumber && (
                                <div className="flex items-center space-x-1">
                                  <Hash className="h-3 w-3" />
                                  <span>Table {order.tableNumber}</span>
                                </div>
                              )}
                            </div>
                            <span>{new Date(order.timestamps.created).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        {index < Math.min(completedOrders.length, 10) - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Orders State */}
            {orders.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-16 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600">Orders will appear here when customers place them</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Details - Desktop */}
          {!isMobile && (
            <div className="lg:col-span-1">
              {selectedOrder ? (
                <OrderDetailsPanel 
                  order={selectedOrder}
                  onUpdateStatus={updateOrderStatus}
                  onUpdateComments={updateComments}
                  onCompleteOrder={completeOrder}
                  isUpdating={isUpdating}
                />
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Order</h3>
                    <p className="text-gray-600">Click on an order to view details and manage status</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Order Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Order #{selectedOrder.orderId.split('-')[1]}
                </SheetTitle>
                <SheetDescription>
                  Manage order status and view details
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <OrderDetailsPanel 
                  order={selectedOrder}
                  onUpdateStatus={updateOrderStatus}
                  onUpdateComments={updateComments}
                  onCompleteOrder={completeOrder}
                  isUpdating={isUpdating}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Order Details Panel Component
function OrderDetailsPanel({ 
  order, 
  onUpdateStatus, 
  onUpdateComments, 
  onCompleteOrder,
  isUpdating 
}: {
  order: Order;
  onUpdateStatus: (orderId: string, field: 'orderStatus' | 'paymentStatus', value: string) => void;
  onUpdateComments: (orderId: string, comments: string) => void;
  onCompleteOrder: (orderId: string) => void;
  isUpdating: boolean;
}) {
  const [comments, setComments] = useState(order.comments || '');

  useEffect(() => {
    setComments(order.comments || '');
  }, [order.comments]);

  const handleCommentsBlur = () => {
    if (comments !== order.comments) {
      onUpdateComments(order.orderId, comments);
    }
  };

  // Fixed completion logic - both conditions must be true
  const canCompleteOrder = (order: Order) => {
    return order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.PAID;
  };

  const isOrderCompleted = (order: Order) => {
    return order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.PAID;
  };

  // Check if order can be marked as complete (either served+unpaid OR prepared+paid)
  const canMarkComplete = (order: Order) => {
    return (order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.UNPAID) ||
           (order.orderStatus === OrderStatus.PREPARED && order.paymentStatus === PaymentStatus.PAID);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-mono">#{order.orderId.split('-')[1]}</CardTitle>
            <CardDescription>
              {new Date(order.timestamps.created).toLocaleString()}
            </CardDescription>
          </div>
          {isOrderCompleted(order) && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Info */}
        {(order.customerName || order.tableNumber) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Customer Information</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {order.customerName && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{order.customerName}</span>
                </div>
              )}
              {order.tableNumber && (
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Table {order.tableNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Order Items</h4>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.quantityDescription}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{item.quantity}x ₹{item.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">₹{(item.quantity * item.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold bg-gray-50 rounded-lg p-3">
          <span>Total Amount:</span>
          <span>₹{order.totalAmount.toFixed(2)}</span>
        </div>

        <Separator />

        {/* Status Controls */}
        {!isOrderCompleted(order) && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Order Management</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Status</label>
                <Select
                  value={order.orderStatus}
                  onValueChange={(value) => onUpdateStatus(order.orderId, 'orderStatus', value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrderStatus.TAKEN}>Taken</SelectItem>
                    <SelectItem value={OrderStatus.PREPARING}>Preparing</SelectItem>
                    <SelectItem value={OrderStatus.PREPARED}>Prepared</SelectItem>
                    <SelectItem value={OrderStatus.SERVED}>Served</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <Select
                  value={order.paymentStatus}
                  onValueChange={(value) => onUpdateStatus(order.orderId, 'paymentStatus', value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentStatus.UNPAID}>Unpaid</SelectItem>
                    <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                    <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Complete Order Button - Only show if both served AND paid */}
            {canMarkComplete(order) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 mb-3">
                  {order.orderStatus === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.UNPAID
                    ? "Order is served but payment is pending. Mark as paid to complete."
                    : "Order is prepared and paid. Mark as served to complete."
                  }
                </p>
                <Button
                  onClick={() => onCompleteOrder(order.orderId)}
                  disabled={isUpdating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Order
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            placeholder="Add notes about this order..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            onBlur={handleCommentsBlur}
            rows={3}
            className="text-sm"
            disabled={isOrderCompleted(order)}
          />
        </div>

        {/* Customer Comments */}
        {order.comments && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Instructions</label>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">{order.comments}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}