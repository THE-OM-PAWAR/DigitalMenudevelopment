'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { 
  Store, Search, Leaf, Beef, MapPin, Phone, 
  ChefHat, Utensils, Star, Clock, Grid3X3, Plus, Minus, ShoppingCart, History, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import ThemeProvider from '@/components/ThemeProvider';
import OrderCart from '@/components/OrderCart';
import { OrderItem, Order, OrderStatus, PaymentStatus } from '@/lib/orderTypes';
import axios from 'axios';
import { useOrderSync } from '@/hooks/useOrderSync';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  address?: string;
  phone?: string;
  theme?: string;
  orderManagementEnabled?: boolean;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  image?: string;
}

interface Item {
  _id: string;
  name: string;
  description: string;
  image?: string;
  categoryId: {
    _id: string;
    name: string;
  };
  isVeg: boolean;
  quantityPrices: {
    quantityId: {
      _id: string;
      value: string;
      description: string;
    };
    price: number;
  }[];
}

export default function PublicMenuPage() {
  const params = useParams();
  const outletId = params?.outletId as string;

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [highlightedItems, setHighlightedItems] = useState<Item[]>([]);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [error, setError] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const {
    activeOrder,
    orderHistory,
    isLoading: orderSyncLoading,
    connectionStatus,
    refreshOrder
  } = useOrderSync({
    outletId,
  });

  useEffect(() => {
    if (outletId) {
      fetchMenuData();
    }
  }, [outletId]);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${outletId}`);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem(`cart-${outletId}`);
      }
    }
  }, [outletId]);

  // Save cart to localStorage whenever cartItems changes
  useEffect(() => {
    if (outletId) {
      localStorage.setItem(`cart-${outletId}`, JSON.stringify(cartItems));
    }
  }, [cartItems, outletId]);

  const fetchMenuData = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!outletId || outletId.length !== 24) {
        setError('Invalid outlet ID format');
        return;
      }

      const requests = [
        axios.get(`/api/public/outlets/${outletId}`),
        axios.get(`/api/public/categories?outletId=${outletId}`),
        axios.get(`/api/public/items?outletId=${outletId}`),
        axios.get(`/api/public/items/highlighted?outletId=${outletId}`)
      ];

      const [outletResponse, categoriesResponse, itemsResponse, highlightedResponse] = await Promise.all(
        requests.map(request => 
          request.catch(err => {
            console.error('API request failed:', err.response?.data || err.message);
            throw err;
          })
        )
      );

      setOutlet(outletResponse.data.outlet);
      setCategories(categoriesResponse.data.categories || []);
      setItems(itemsResponse.data.items || []);
      setHighlightedItems(highlightedResponse.data.items || []);
    } catch (error: any) {
      console.error('Error fetching menu data:', error);
      if (error.response?.status === 404) {
        setError('Menu not found');
      } else if (error.response?.status === 400) {
        setError('Invalid outlet ID');
      } else {
        setError('Failed to load menu. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item: Item, quantityPrice: { quantityId: { _id: string; value: string; description: string }; price: number }) => {
    const cartItemId = `${item._id}-${quantityPrice.quantityId._id}`;
    
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === cartItemId);
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        const newItem: OrderItem = {
          id: cartItemId,
          name: item.name,
          quantity: 1,
          price: quantityPrice.price,
          quantityId: quantityPrice.quantityId._id,
          quantityDescription: quantityPrice.quantityId.description,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getCartItemQuantity = (itemId: string, quantityId: string) => {
    const cartItemId = `${itemId}-${quantityId}`;
    const cartItem = cartItems.find(item => item.id === cartItemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.categoryId._id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedItems = categories.reduce((acc, category) => {
    const categoryItems = filteredItems.filter(item => item.categoryId._id === category._id);
    if (categoryItems.length > 0) {
      acc[category._id] = {
        category,
        items: categoryItems
      };
    }
    return acc;
  }, {} as Record<string, { category: Category; items: Item[] }>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={fetchMenuData}
            className="bg-gray-900 hover:bg-gray-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!outlet) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Outlet Not Found</h1>
          <p className="text-gray-600 mb-6">The requested outlet could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider themeId={outlet.theme || 'modern'}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}>
        {/* Header */}
        <div className="sticky top-0 z-50" style={{ backgroundColor: 'var(--theme-background)', borderBottomColor: 'var(--theme-border)' }}>
          <div className="px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              {/* Left - Outlet Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-primary)' }}>
                  {outlet.logo ? (
                    <img 
                      src={outlet.logo} 
                      alt={outlet.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <Store className="h-6 w-6" style={{ color: 'var(--theme-background)' }} />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--theme-font-heading)', color: 'var(--theme-text)' }}>
                    {outlet.name}
                  </h1>
                  <div className="flex items-center text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    <Star className="h-3 w-3 mr-1" style={{ color: 'var(--theme-accent)' }} />
                    <span>4.8 • Open now</span>
                  </div>
                </div>
              </div>

              {/* Right - Location Button and Order History Button */}
              <div className="flex items-center space-x-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}>
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">Location</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                    <SheetHeader>
                      <SheetTitle style={{ color: 'var(--theme-text)' }}>Location & Contact</SheetTitle>
                      <SheetDescription style={{ color: 'var(--theme-text-secondary)' }}>
                        Find us and get in touch
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {outlet.address && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
                          <div>
                            <p className="font-medium" style={{ color: 'var(--theme-text)' }}>Address</p>
                            <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{outlet.address}</p>
                          </div>
                        </div>
                      )}
                      {outlet.phone && (
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
                          <div>
                            <p className="font-medium" style={{ color: 'var(--theme-text)' }}>Phone</p>
                            <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{outlet.phone}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start space-x-3">
                        <Clock className="h-5 w-5 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
                        <div>
                          <p className="font-medium" style={{ color: 'var(--theme-text)' }}>Hours</p>
                          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Open • Closes 11:00 PM</p>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                {/* Order History/Tracking Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Orders</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-8" style={{ paddingBottom: cartItems.length > 0 ? '120px' : '32px' }}>
          {/* Popular Items Section */}
          {highlightedItems.length > 0 && (
            <div className="py-4">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--theme-font-heading)', color: 'var(--theme-text)' }}>
                  Popular Items
                </h2>
              </div>
              <div className="flex space-x-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {highlightedItems.map((item) => (
                  <Drawer key={item._id}>
                    <DrawerTrigger asChild>
                      <div className="flex-shrink-0 w-32 cursor-pointer">
                        <div className="relative">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-surface)' }}>
                              <Utensils className="h-6 w-6" style={{ color: 'var(--theme-text-secondary)' }} />
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            <div 
                              className="w-4 h-4 rounded-full border flex items-center justify-center"
                              style={{
                                backgroundColor: item.isVeg ? 'var(--theme-veg)' : 'var(--theme-non-veg)',
                                borderColor: item.isVeg ? 'var(--theme-veg)' : 'var(--theme-non-veg)',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          </div>
                          <div className="absolute top-1 right-1">
                            <Star className="h-3 w-3" style={{ color: 'var(--theme-accent)' }} />
                          </div>
                        </div>
                        <p className="text-xs font-medium mt-1 line-clamp-2" style={{ color: 'var(--theme-text)' }}>
                          {item.name}
                        </p>
                        <p className="text-xs font-bold" style={{ color: 'var(--theme-accent)' }}>
                          ₹{item.quantityPrices[0]?.price.toFixed(0)}
                        </p>
                      </div>
                    </DrawerTrigger>
                    <DrawerContent style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                      <DrawerHeader>
                        <DrawerTitle style={{ color: 'var(--theme-text)' }}>{item.name}</DrawerTitle>
                        <DrawerDescription style={{ color: 'var(--theme-text-secondary)' }}>
                          {item.description}
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="px-4 pb-6">
                        {item.image && (
                          <div className="w-full h-64 mb-4 rounded-lg overflow-hidden">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 mb-4">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-accent)' }}>
                              <span className="text-xs font-bold text-white">₹</span>
                            </div>
                            <h4 className="font-semibold text-lg" style={{ color: 'var(--theme-text)' }}>Pricing Options</h4>
                          </div>
                          {item.quantityPrices.map((qp, index) => {
                            const cartQuantity = getCartItemQuantity(item._id, qp.quantityId._id);
                            return (
                              <div 
                                key={index} 
                                className="flex justify-between items-center py-4 px-4 rounded-lg border-2"
                                style={{ 
                                  backgroundColor: 'var(--theme-background)',
                                  borderColor: 'var(--theme-accent)',
                                  borderStyle: 'solid'
                                }}
                              >
                                <div>
                                  <span className="font-semibold text-lg" style={{ color: 'var(--theme-text)' }}>{qp.quantityId.value}</span>
                                  <span className="text-sm ml-2 block" style={{ color: 'var(--theme-text-secondary)' }}>({qp.quantityId.description})</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl font-bold" style={{ color: 'var(--theme-accent)' }}>
                                    ₹{qp.price.toFixed(2)}
                                  </span>
                                  {outlet.orderManagementEnabled && (
                                    <div className="flex items-center space-x-2">
                                      {cartQuantity > 0 ? (
                                        <div className="flex items-center space-x-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateCartItemQuantity(`${item._id}-${qp.quantityId._id}`, cartQuantity - 1)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Minus className="h-4 w-4" />
                                          </Button>
                                          <span className="w-8 text-center font-medium">{cartQuantity}</span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateCartItemQuantity(`${item._id}-${qp.quantityId._id}`, cartQuantity + 1)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          onClick={() => addToCart(item, qp)}
                                          size="sm"
                                          className="bg-orange-600 hover:bg-orange-700 text-white"
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Add
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
          {categories.length > 0 && (
            <div className="py-4">
              <div className="flex items-center space-x-2 mb-4">
                <Grid3X3 className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--theme-font-heading)', color: 'var(--theme-text)' }}>
                  Categories
                </h2>
              </div>
              
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                
                {/* All Categories Button */}
                <div
                  onClick={() => setSelectedCategory('all')}
                  className={`flex-shrink-0 w-28 h-28 cursor-pointer rounded-xl relative overflow-hidden snap-start transition-all border ${selectedCategory === 'all' ? 'border-orange-500 shadow-lg' : 'border-transparent hover:border-gray-300 hover:shadow'} group`}
                  style={{
                    background: selectedCategory === 'all'
                      ? 'linear-gradient(135deg, #fbbf24 0%, #f87171 100%)'
                      : 'var(--theme-surface)',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                    <div className={`flex items-center justify-center rounded-full bg-white/20 mb-2 transition-all ${selectedCategory === 'all' ? 'scale-110' : ''}`} style={{ width: 36, height: 36 }}>
                      <Grid3X3 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">All</span>
                    <span className="text-xs opacity-80 mt-1">{items.length}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all" />
                </div>
                
                {categories.map((category) => {
                  const categoryItemCount = items.filter(item => item.categoryId._id === category._id).length;
                  return (
                    <div
                      key={category._id}
                      onClick={() => setSelectedCategory(category._id)}
                      className={`flex-shrink-0 w-28 h-28 cursor-pointer rounded-2xl relative overflow-hidden snap-start transition-all`}
                      style={{ 
                        borderColor: selectedCategory === category._id ? 'var(--theme-primary)' : 'transparent',
                        borderWidth: selectedCategory === category._id ? 2 : 0,
                        borderStyle: 'solid'
                      }}
                    >
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500"></div>
                      )}
                      
                      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                        <span className="text-sm font-semibold text-center leading-tight mb-1">
                          {category.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--theme-text-secondary)' }} />
              <Input
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ 
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-surface)',
                  color: 'var(--theme-text)'
                }}
              />
            </div>
          </div>

          {/* Menu Items by Category */}
          {Object.keys(groupedItems).length > 0 ? (
            <div className="space-y-6">
              {Object.values(groupedItems).map(({ category, items }, idx) => (
                <section key={category._id}>
                  {/* Category Header */}
                  <div
                    className={`flex items-center justify-between mb-4 p-4 rounded-xl ${idx === 0 ? 'mt-2' : 'mt-16'}`}
                    style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-background)' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-background)' }}>
                        <ChefHat className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                      </div>
                      <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--theme-font-heading)' }}>
                        {category.name}
                      </h3>
                    </div>
                    <Badge variant="secondary" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-accent)' }}>
                      {items.length} items
                    </Badge>
                  </div>

                  {/* Items List */}
                  <div className="space-y-0 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--theme-surface)' }}>
                    {items.map((item, index) => (
                      <div key={item._id}>
                        <Drawer>
                          <DrawerTrigger asChild>
                            <div className="flex items-center space-x-3 p-3 cursor-pointer transition-all hover:opacity-80" style={{ backgroundColor: 'var(--theme-surface)' }}>
                              {/* Item Image */}
                              <div className="relative flex-shrink-0">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-background)' }}>
                                    <Utensils className="h-6 w-6" style={{ color: 'var(--theme-text-secondary)' }} />
                                  </div>
                                )}
                                <div className="absolute -top-1 -left-1">
                                  <div 
                                    className="w-3 h-3 rounded-full border-2 flex items-center justify-center"
                                    style={{
                                      backgroundColor: item.isVeg ? 'var(--theme-veg)' : 'var(--theme-non-veg)',
                                      borderColor: item.isVeg ? 'var(--theme-veg)' : 'var(--theme-non-veg)',
                                    }}
                                  >
                                    <div className="w-1 h-1 rounded-full bg-white" />
                                  </div>
                                </div>
                              </div>

                              {/* Item Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base truncate" style={{ color: 'var(--theme-text)' }}>
                                  {item.name}
                                </h4>
                              </div>

                              {/* Price and Add Button */}
                              <div className="flex-shrink-0 flex items-center space-x-3">
                                <div className="text-right">
                                  <p className="font-bold text-md" style={{ color: 'var(--theme-accent)' }}>
                                    ₹{item.quantityPrices[0]?.price.toFixed(0)}
                                  </p>
                                  {item.quantityPrices.length > 1 && (
                                    <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                                      +{item.quantityPrices.length - 1} more
                                    </p>
                                  )}
                                </div>
                                
                                {outlet.orderManagementEnabled && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                      const firstQuantityPrice = item.quantityPrices[0];
                                      const cartQuantity = getCartItemQuantity(item._id, firstQuantityPrice.quantityId._id);
                                      
                                      return cartQuantity > 0 ? (
                                        <div className="flex items-center space-x-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateCartItemQuantity(`${item._id}-${firstQuantityPrice.quantityId._id}`, cartQuantity - 1)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Minus className="h-4 w-4" />
                                          </Button>
                                          <span className="w-8 text-center font-medium">{cartQuantity}</span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateCartItemQuantity(`${item._id}-${firstQuantityPrice.quantityId._id}`, cartQuantity + 1)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          onClick={() => addToCart(item, firstQuantityPrice)}
                                          size="sm"
                                          className="bg-orange-600 hover:bg-orange-700 text-white h-8 w-8 p-0"
                                        >
                                          <Plus className="h-4 w-4" />
                                          
                                        </Button>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </DrawerTrigger>
                          <DrawerContent style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                            <DrawerHeader>
                              <DrawerTitle style={{ color: 'var(--theme-text)' }}>{item.name}</DrawerTitle>
                              <DrawerDescription style={{ color: 'var(--theme-text-secondary)' }}>
                                {item.description}
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="px-4 pb-6">
                              {item.image && (
                                <div className="w-full h-64 mb-4 rounded-lg overflow-hidden">
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-accent)' }}>
                                    <span className="text-xs font-bold text-white">₹</span>
                                  </div>
                                  <h4 className="font-semibold text-lg" style={{ color: 'var(--theme-text)' }}>Pricing Options</h4>
                                </div>
                                {item.quantityPrices.map((qp, index) => {
                                  const cartQuantity = getCartItemQuantity(item._id, qp.quantityId._id);
                                  return (
                                    <div 
                                      key={index} 
                                      className="flex justify-between items-center py-4 px-4 rounded-lg border-2"
                                      style={{ 
                                        backgroundColor: 'var(--theme-background)',
                                        borderColor: 'var(--theme-accent)',
                                        borderStyle: 'solid'
                                      }}
                                    >
                                      <div className='flex-row flex'>
                                        <span className="font-semibold text-md" style={{ color: 'var(--theme-text)' }}>{qp.quantityId.value}</span>
                                        <span className="text-sm ml-2 block" style={{ color: 'var(--theme-text-secondary)' }}>({qp.quantityId.description})</span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className="text-lg font-bold" style={{ color: 'var(--theme-accent)' }}>
                                          ₹{qp.price.toFixed(2)}
                                        </span>
                                        {outlet.orderManagementEnabled && (
                                          <div className="flex items-center space-x-2">
                                            {cartQuantity > 0 ? (
                                              <div className="flex items-center space-x-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => updateCartItemQuantity(`${item._id}-${qp.quantityId._id}`, cartQuantity - 1)}
                                                  className="h-8 w-8 p-0"
                                                >
                                                  <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center font-medium">{cartQuantity}</span>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => updateCartItemQuantity(`${item._id}-${qp.quantityId._id}`, cartQuantity + 1)}
                                                  className="h-8 w-8 p-0"
                                                >
                                                  <Plus className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ) : (
                                              <Button
                                                onClick={() => addToCart(item, qp)}
                                                size="sm"
                                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                              >
                                                <Plus className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </DrawerContent>
                        </Drawer>
                        {index < items.length - 1 && (
                          <Separator style={{ backgroundColor: 'var(--theme-border)' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--theme-text-secondary)' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>No items found</h3>
                    <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
                      Try adjusting your search or selecting a different category.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-background)' }}
                    >
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Utensils className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--theme-text-secondary)' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>Menu Coming Soon</h3>
                    <p style={{ color: 'var(--theme-text-secondary)' }}>
                      We're working on adding delicious items to our menu. Please check back later!
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Cart - Always render if order management is enabled */}
        {outlet.orderManagementEnabled && (
          <OrderCart
            outletId={outletId}
            cartItems={cartItems}
            onUpdateCart={setCartItems}
          />
        )}

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
                        {connectionStatus === 'connected' ? (
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
                          disabled={orderSyncLoading}
                        >
                          <RefreshCw className={`h-4 w-4 ${orderSyncLoading ? 'animate-spin' : ''}`} />
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
                            <Badge variant="secondary" className={`mb-1 ${activeOrder.orderStatus === OrderStatus.TAKEN ? 'bg-blue-100 text-blue-800 border-blue-200' : activeOrder.orderStatus === OrderStatus.PREPARING ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : activeOrder.orderStatus === OrderStatus.PREPARED ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{activeOrder.orderStatus}</Badge>
                            <Badge variant="outline" className={`mb-1 ml-1 ${activeOrder.paymentStatus === PaymentStatus.UNPAID ? 'bg-red-100 text-red-800 border-red-200' : activeOrder.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{activeOrder.paymentStatus}</Badge>
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
                        {/* Order Progress */}
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-3">Order Progress</h4>
                          <div className="space-y-2">
                            {Object.values(OrderStatus).map((status, index) => {
                              const isCompleted = Object.values(OrderStatus).indexOf(activeOrder.orderStatus) >= index;
                              const isCurrent = activeOrder.orderStatus === status;
                              return (
                                <div key={status} className={`flex items-center space-x-3 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                  <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-gray-300'} ${isCurrent ? 'animate-pulse' : ''}`} />
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

        {/* Footer */}
        <footer className="border-t mt-8" style={{ backgroundColor: 'var(--theme-surface)', borderTopColor: 'var(--theme-border)' }}>
          <div className="px-4 py-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-primary)' }}>
                  <Store className="h-4 w-4" style={{ color: 'var(--theme-background)' }} />
                </div>
                <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>{outlet.name}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Powered by MenuMaster
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}