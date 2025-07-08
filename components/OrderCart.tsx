'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { 
  ShoppingCart, Plus, Minus, Trash2, User, Hash, 
  MessageSquare, CreditCard, CheckCircle, Loader2, Clock, History, Edit3, X,
  Wifi, WifiOff, RefreshCw, AlertCircle,
  ChevronRight
} from 'lucide-react';
import { OrderItem, Order, OrderStatus, PaymentStatus } from '@/lib/orderTypes';
import { useOrderSync } from '@/hooks/useOrderSync';

interface OrderCartProps {
  outletId: string;
  cartItems: OrderItem[];
  onUpdateCart: (items: OrderItem[]) => void;
}

export default function OrderCart({ outletId, cartItems, onUpdateCart }: OrderCartProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [comments, setComments] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editOrderItems, setEditOrderItems] = useState<OrderItem[]>([]);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const {
    activeOrder,
    orderHistory,
    isLoading,
    connectionStatus,
    isConnected,
    createOrder,
    updateOrder,
    refreshOrder,
    isOrderCompleted,
    hasNetworkError
  } = useOrderSync({
    outletId,
    onOrderUpdate: (order) => {
      console.log('Order updated:', order.orderId, order.orderStatus);
    },
    onOrderComplete: (order) => {
      console.log('Order completed:', order.orderId);
    }
  });

  useEffect(() => {
    if (hasNetworkError) {
      setShowOfflineModal(true);
    } else {
      setShowOfflineModal(false);
    }
  }, [hasNetworkError]);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Helper function to check if order can be edited
  const canEditOrder = (orderStatus: OrderStatus, paymentStatus: PaymentStatus) => {
    return orderStatus === OrderStatus.TAKEN && paymentStatus === PaymentStatus.UNPAID;
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    onUpdateCart(updatedItems);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    onUpdateCart(updatedItems);
  };

  const clearCart = () => {
    onUpdateCart([]);
    localStorage.removeItem(`cart-${outletId}`);
  };

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  const submitOrder = async () => {
    if (cartItems.length === 0) return;

    try {
      const newOrder = await createOrder({
        items: cartItems,
        totalAmount,
        comments,
        customerName,
        tableNumber,
      });

      setOrderSubmitted(true);
      clearCart();
      setIsCheckoutOpen(false);
      
      // Reset form
      setCustomerName('');
      setTableNumber('');
      setComments('');

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setOrderSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting order:', error);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditOrderItems([...order.items]);
  };

  const updateEditOrderQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setEditOrderItems(prev => prev.filter(item => item.id !== itemId));
      return;
    }

    setEditOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const saveOrderEdit = async () => {
    if (!editingOrder || editOrderItems.length === 0) return;

    try {
      const newTotalAmount = editOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await updateOrder(editingOrder.orderId, {
        items: editOrderItems,
        totalAmount: newTotalAmount,
      });
      
      setEditingOrder(null);
      setEditOrderItems([]);
    } catch (error) {
      console.error('Error updating order:', error);
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
      case OrderStatus.PREPARING: return <Loader2 className="h-4 w-4 animate-spin" />;
      case OrderStatus.PREPARED: return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.SERVED: return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Show active order if exists, otherwise show cart
  const shouldShowCart = cartItems.length > 0 || activeOrder;

  if (!shouldShowCart) {
    return null;
  }

  return (
    <>
      {/* Floating Cart/Order Status */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
        {activeOrder ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="View Order Details"
            onClick={() => setShowHistory(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowHistory(true); }}
            className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
            style={{ cursor: 'pointer' }}
          >
            <Card className="shadow-lg border-2 bg-white" style={{
              borderColor: activeOrder.orderStatus === OrderStatus.TAKEN ? '#f59e0b' : 
                          activeOrder.orderStatus === OrderStatus.PREPARING ? '#3b82f6' :
                          activeOrder.orderStatus === OrderStatus.PREPARED ? '#10b981' : '#6b7280'
            }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {getStatusIcon(activeOrder.orderStatus)}
                      {/* Connection indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Order {activeOrder.orderId.split('-')[1]}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(activeOrder.orderStatus)}`}>
                          {activeOrder.orderStatus}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getPaymentColor(activeOrder.paymentStatus)}`}>
                          {activeOrder.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isConnected && (
                      <Button
                        onClick={e => { e.stopPropagation(); refreshOrder(); }}
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                    )}
                    {canEditOrder(activeOrder.orderStatus, activeOrder.paymentStatus) && (
                      <Button
                        onClick={e => { e.stopPropagation(); handleEditOrder(activeOrder); }}
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {/* If no Edit button, show right arrow */}
                    {!canEditOrder(activeOrder.orderStatus, activeOrder.paymentStatus) && (
                      <ChevronRight className="h-6 w-6 text-gray-400 ml-2" />
                    )}
                  </div>
                </div>
                
                {/* Show offline warning */}
                {!isConnected && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-xs text-yellow-800">
                        Connection lost. Order updates may be delayed.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-label="Open Checkout"
            onClick={() => setIsCheckoutOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsCheckoutOpen(true); }}
            className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
            style={{ cursor: 'pointer' }}
          >
            <Card className="shadow-lg border-2 border-orange-500 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <ShoppingCart className="h-6 w-6 text-orange-600" />
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-orange-600 text-white text-xs">
                        {totalItems}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{totalItems} items</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={orderSubmitted} onOpenChange={setOrderSubmitted}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-green-600">
              Order Confirmed!
            </DialogTitle>
            <DialogDescription>
              Your order has been successfully placed and is being processed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {activeOrder && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="text-lg font-mono font-bold">{activeOrder.orderId}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-bold">₹{activeOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="secondary">{activeOrder.orderStatus}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <Badge variant="outline">{activeOrder.paymentStatus}</Badge>
                  </div>
                </div>
              </>
            )}
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Your order is being prepared. You can track its progress in real-time!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Drawer */}
      <Drawer open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DrawerContent className="max-h-[90vh]">
          {/* Connection Status Indicator (inside drawer) */}
          <div className="flex justify-end mb-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : connectionStatus === 'reconnecting'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>Live</span>
                </>
              ) : connectionStatus === 'reconnecting' ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Reconnecting</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
          <DrawerHeader>
            <DrawerTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Your Order
            </DrawerTitle>
            <DrawerDescription>
              Review your order and provide details
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Connection Warning */}
              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <WifiOff className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      You're currently offline. Order will be submitted when connection is restored.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Items</h3>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.quantityDescription}</p>
                      <p className="text-sm font-semibold">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Customer Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name (Optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customerName"
                        placeholder="Your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tableNumber">Table (Optional)</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="tableNumber"
                        placeholder="Table number"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label htmlFor="comments">Special Instructions (Optional)</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="comments"
                    placeholder="Any special requests..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="pl-10"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600">Payment will be collected at the counter</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1"
                >
                  Continue Shopping
                </Button>
                <Button
                  onClick={submitOrder}
                  disabled={isLoading || cartItems.length === 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit Order Drawer */}
      <Drawer open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center">
              <Edit3 className="h-5 w-5 mr-2" />
              Edit Order {editingOrder?.orderId.split('-')[1]}
            </DrawerTitle>
            <DrawerDescription>
              Modify your order items and quantities
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Edit Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Items</h3>
                {editOrderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.quantityDescription}</p>
                      <p className="text-sm font-semibold">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEditOrderQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEditOrderQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEditOrderQuantity(item.id, 0)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Updated Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Updated Total:</span>
                  <span>₹{editOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveOrderEdit}
                  disabled={isLoading || editOrderItems.length === 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Order History/Tracking Drawer */}
      <Drawer open={showHistory} onOpenChange={setShowHistory}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              {activeOrder ? 'Order Tracking' : 'Order History'}
            </DrawerTitle>
            <DrawerDescription>
              {activeOrder ? 'Track your current order status in real-time' : 'View your previous orders'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Current Active Order */}
              {activeOrder && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-600">Current Order</h3>
                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Wifi className="h-4 w-4" />
                          <span className="text-xs">Live</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <WifiOff className="h-4 w-4" />
                          <span className="text-xs">Offline</span>
                        </div>
                      )}
                      <Button
                        onClick={refreshOrder}
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{activeOrder.orderId}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(activeOrder.timestamps.created).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className={`mb-1 ${getStatusColor(activeOrder.orderStatus)}`}>
                            {activeOrder.orderStatus}
                          </Badge>
                          <Badge variant="outline" className={`mb-1 ml-1 ${getPaymentColor(activeOrder.paymentStatus)}`}>
                            {activeOrder.paymentStatus}
                          </Badge>
                          <p className="font-bold">₹{activeOrder.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {activeOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {canEditOrder(activeOrder.orderStatus, activeOrder.paymentStatus) && (
                        <Button
                          onClick={() => handleEditOrder(activeOrder)}
                          size="sm"
                          className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Order
                        </Button>
                      )}

                      {/* Order Progress */}
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">Order Progress</h4>
                        <div className="space-y-2">
                          {Object.values(OrderStatus).map((status, index) => {
                            const isCompleted = Object.values(OrderStatus).indexOf(activeOrder.orderStatus) >= index;
                            const isCurrent = activeOrder.orderStatus === status;
                            
                            return (
                              <div key={status} className={`flex items-center space-x-3 ${
                                isCompleted ? 'text-green-600' : 'text-gray-400'
                              }`}>
                                <div className={`w-3 h-3 rounded-full ${
                                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                                } ${isCurrent ? 'animate-pulse' : ''}`} />
                                <span className="text-sm capitalize">{status}</span>
                                {isCurrent && <span className="text-xs">(Current)</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Order History */}
              {orderHistory.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Order History</h3>
                  {orderHistory.map((order) => (
                    <Card key={order.orderId} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">{order.orderId}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.timestamps.created).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              Completed
                            </Badge>
                            <p className="font-bold">₹{order.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!activeOrder && orderHistory.length === 0 && (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                  <p className="text-gray-600">Your order history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer> 

      {/* Offline Modal */}
      <Dialog open={showOfflineModal} onOpenChange={setShowOfflineModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-yellow-600">
              Connection Lost
            </DialogTitle>
            <DialogDescription>
              You are currently offline. Please reload the page to try reconnecting.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4 space-x-2">
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowOfflineModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}