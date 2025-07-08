'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, ArrowLeft, Loader2, Save, Upload, Store, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/DashboardHeader';
import axios from 'axios';
import Link from 'next/link';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  orderManagementEnabled?: boolean;
}

export default function OutletSettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [orderManagementEnabled, setOrderManagementEnabled] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: '',
    address: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchOutlet();
    }
  }, [user]);

  useEffect(() => {
    if (outlet && outlet._id) {
      fetchOrderManagementSetting(outlet._id);
    }
  }, [outlet]);

  const fetchOrderManagementSetting = async (outletId: string) => {
    try {
      const settingsResponse = await axios.get(`/api/outlets/${outletId}/settings`);
      setOrderManagementEnabled(!!settingsResponse.data.orderManagementEnabled);
    } catch (error) {
      setOrderManagementEnabled(false);
    }
  };

  const fetchOutlet = async () => {
    try {
      const outletResponse = await axios.get('/api/outlets');
      const outletData = outletResponse.data.outlet;
      if (!outletData) {
        router.push('/dashboard');
        return;
      }
      setOutlet(outletData);
      setFormData({
        name: outletData.name || '',
        logo: outletData.logo || '',
        description: outletData.description || '',
        address: outletData.address || '',
        phone: outletData.phone || '',
      });
    } catch (error) {
      console.error('Error fetching outlet:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOrderManagementToggle = async (enabled: boolean) => {
    if (!outlet || !outlet._id) return;
    try {
      await axios.put(`/api/outlets/${outlet._id}/settings`, {
        orderManagementEnabled: enabled
      });
      setOrderManagementEnabled(enabled);
    } catch (error) {
      console.error('Error updating order management setting:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Outlet name is required';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !outlet) return;

    setIsSaving(true);
    try {
      const response = await axios.put(`/api/outlets/${outlet._id}`, formData);
      setOutlet(response.data.outlet);
    } catch (error: any) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Failed to update outlet settings' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading outlet settings...</p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Outlet Settings</h1>
          <p className="text-gray-600">Manage your outlet information and features</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Outlet Overview */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm">
              <CardHeader className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-900 rounded-lg flex items-center justify-center">
                  {outlet.logo ? (
                    <img 
                      src={outlet.logo} 
                      alt={outlet.name}
                      className="w-20 h-20 rounded object-cover"
                    />
                  ) : (
                    <Store className="h-12 w-12 text-white" />
                  )}
                </div>
                <CardTitle className="text-xl">{outlet.name}</CardTitle>
                <CardDescription>
                  Created on {new Date(outlet.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {outlet.description && (
                    <p className="text-gray-600">{outlet.description}</p>
                  )}
                  {outlet.address && (
                    <div className="flex items-start text-gray-600">
                      <Building className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{outlet.address}</span>
                    </div>
                  )}
                  {outlet.phone && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📞</span>
                      <span>{outlet.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Management Settings */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Order Management
                </CardTitle>
                <CardDescription>
                  Enable real-time order management for your outlet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="order-management">Enable Order Management</Label>
                    <p className="text-sm text-gray-600">
                      Allow customers to place orders through your digital menu
                    </p>
                  </div>
                  <Switch
                    id="order-management"
                    checked={orderManagementEnabled}
                    onCheckedChange={handleOrderManagementToggle}
                  />
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${orderManagementEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium">
                      Status: {orderManagementEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {orderManagementEnabled 
                      ? 'Customers can now place orders through your menu. You can manage orders from the Orders page.'
                      : 'Order management is disabled. Customers can view your menu but cannot place orders.'
                    }
                  </p>
                </div>

                {orderManagementEnabled && (
                  <div className="pt-4">
                    <Link href="/dashboard/orders">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Manage Orders
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outlet Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Outlet Information</CardTitle>
                    <CardDescription>
                      Update your outlet details and branding
                    </CardDescription>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Outlet Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Downtown Cafe"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of your outlet..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Full address of your outlet..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g., +1 (555) 123-4567"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Branding */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Branding</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                      name="logo"
                      value={formData.logo}
                      onChange={handleInputChange}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-gray-500">
                      Enter a URL to your logo image. For best results, use a square image (1:1 ratio).
                    </p>
                  </div>

                  {formData.logo && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img 
                        src={formData.logo} 
                        alt="Logo preview"
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-gray-600">Logo preview</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}