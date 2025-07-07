'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ChefHat, Package, Utensils, ArrowLeft, Loader2, Palette } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/DashboardHeader';
import axios from 'axios';
import Link from 'next/link';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
}

export default function MenuManagementPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      
      if (!response.data.outlet) {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error fetching outlet:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
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
          <p className="text-gray-600">Loading menu management...</p>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
          <p className="text-gray-600">Create and organize your menu</p>
        </div>

        {/* Management Options */}
        <div className="flex flex-col gap-3">
          {/* Categories */}
          <Link href="/dashboard/menu/create-category" className="w-full">
            <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 shadow-sm flex flex-row items-center px-6 py-6 w-full">
              <div className="w-16 h-16 mr-6 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <ChefHat className="h-8 w-8 text-gray-700" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Categories
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm mt-2">
                  Organize your menu with categories
                </CardDescription>
              </div>
            </Card>
          </Link>

          {/* Quantities */}
          <Link href="/dashboard/menu/create-quantity" className="w-full">
            <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 shadow-sm flex flex-row items-center px-6 py-6 w-full">
              <div className="w-16 h-16 mr-6 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Package className="h-8 w-8 text-gray-700" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Quantities
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm mt-2">
                  Define portion sizes and options
                </CardDescription>
              </div>
            </Card>
          </Link>

          {/* Menu Items */}
          <Link href="/dashboard/menu/create-item" className="w-full">
            <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 shadow-sm flex flex-row items-center px-6 py-6 w-full">
              <div className="w-16 h-16 mr-6 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Utensils className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Menu Items
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm mt-2">
                  Add delicious menu items
                </CardDescription>
              </div>
            </Card>
          </Link>

          {/* Change Theme */}
          <Link href="/dashboard/menu/theme" className="w-full">
            <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 shadow-sm flex flex-row items-center px-6 py-6 w-full">
              <div className="w-16 h-16 mr-6 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Palette className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Change Theme
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm mt-2">
                  Customize your menu's appearance
                </CardDescription>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}