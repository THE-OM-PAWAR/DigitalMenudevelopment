'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Store, Plus, Menu, Users, QrCode, TrendingUp, Loader2, ArrowRight, ExternalLink, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/DashboardHeader';
import axios from 'axios';
import Link from 'next/link';
import { OutletInput, OutletSchema } from '@/lib/validations';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  createdAt: string;
  orderManagementEnabled?: boolean;
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [isLoadingOutlet, setIsLoadingOutlet] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCreatingOutlet, setIsCreatingOutlet] = useState(false);
  const [outletName, setOutletName] = useState('');
  const [outletError, setOutletError] = useState('');

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

  const fetchOutlet = async () => {
    try {
      const response = await axios.get('/api/outlets');
      setOutlet(response.data.outlet);
      
      // Show onboarding if no outlet exists
      if (!response.data.outlet) {
        setIsOnboardingOpen(true);
      }
    } catch (error) {
      console.error('Error fetching outlet:', error);
    } finally {
      setIsLoadingOutlet(false);
    }
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOutlet(true);
    setOutletError('');

    try {
      const validatedFields = OutletSchema.safeParse({ name: outletName });
      if (!validatedFields.success) {
        setOutletError(validatedFields.error.issues[0].message);
        return;
      }

      const response = await axios.post('/api/outlets', { name: outletName });
      
      if (response.status === 201) {
        setOutlet(response.data.outlet);
        setIsOnboardingOpen(false);
        setOutletName('');
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        setOutletError('You already have an outlet');
      } else {
        setOutletError('Failed to create outlet. Please try again.');
      }
    } finally {
      setIsCreatingOutlet(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading || isLoadingOutlet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader outlet={outlet || undefined} onSignOut={handleSignOut} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!outlet ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Store className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MenuMaster</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first outlet to manage your digital menu
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Manage your digital menu and outlet</p>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Menu Items</CardTitle>
                  <Menu className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <p className="text-xs text-gray-500">No items yet</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Orders Today</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <p className="text-xs text-gray-500">
                    {outlet.orderManagementEnabled ? 'Ready to receive orders' : 'Enable order management'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">QR Scans</CardTitle>
                  <QrCode className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <p className="text-xs text-gray-500">This month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <p className="text-xs text-gray-500">Uptime</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <Menu className="h-6 w-6 text-gray-700" />
                  </div>
                  <CardTitle className="text-lg">Manage Menu</CardTitle>
                  <CardDescription className="text-gray-600">
                    Add, edit, and organize your menu items and categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/menu">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Order Management</CardTitle>
                  <CardDescription className="text-gray-600">
                    {outlet.orderManagementEnabled 
                      ? 'Manage incoming orders and track status'
                      : 'Enable real-time order management'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {outlet.orderManagementEnabled ? (
                    <Link href="/dashboard/orders">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        View Orders
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard/outlet-settings">
                      <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                        Enable Orders
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <ExternalLink className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">View Public Menu</CardTitle>
                  <CardDescription className="text-gray-600">
                    See how your menu looks to customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => window.open(`/menu/${outlet._id}`, '_blank')}
                  >
                    Open Menu
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <QrCode className="h-6 w-6 text-gray-700" />
                  </div>
                  <CardTitle className="text-lg">QR Codes</CardTitle>
                  <CardDescription className="text-gray-600">
                    Generate and download QR codes for your tables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                    Generate QR
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Onboarding Modal */}
      <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Your Outlet</DialogTitle>
            <DialogDescription className="text-gray-600">
              Let's set up your digital menu. What's the name of your restaurant or cafe?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOutlet} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outlet-name">Outlet Name</Label>
              <Input
                id="outlet-name"
                placeholder="e.g., Downtown Cafe"
                value={outletName}
                onChange={(e) => {
                  setOutletName(e.target.value);
                  if (outletError) setOutletError('');
                }}
                className={outletError ? 'border-red-500' : 'border-gray-300'}
              />
              {outletError && (
                <p className="text-sm text-red-500">{outletError}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800"
              disabled={isCreatingOutlet}
            >
              {isCreatingOutlet ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Outlet'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}