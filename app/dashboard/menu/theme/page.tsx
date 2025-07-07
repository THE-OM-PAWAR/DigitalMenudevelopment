'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Save, Check, Palette, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/DashboardHeader';
import { menuThemes, MenuTheme } from '@/lib/themes';
import axios from 'axios';
import Link from 'next/link';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
  theme?: string;
}

export default function ThemeSelectionPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('modern');
  const [currentTheme, setCurrentTheme] = useState<string>('modern');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const fetchData = async () => {
    try {
      const outletResponse = await axios.get('/api/outlets');
      const outletData = outletResponse.data.outlet;
      
      if (!outletData) {
        router.push('/dashboard');
        return;
      }
      
      setOutlet(outletData);
      
      // Fetch current theme
      try {
        const themeResponse = await axios.get(`/api/outlets/${outletData._id}/theme`);
        const theme = themeResponse.data.theme || 'modern';
        setCurrentTheme(theme);
        setSelectedTheme(theme);
      } catch (error) {
        console.error('Error fetching theme:', error);
        setCurrentTheme('modern');
        setSelectedTheme('modern');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!outlet || selectedTheme === currentTheme) return;

    setIsSaving(true);
    try {
      await axios.put(`/api/outlets/${outlet._id}/theme`, {
        theme: selectedTheme
      });
      
      setCurrentTheme(selectedTheme);
    } catch (error: any) {
      console.error('Error saving theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getThemePreviewStyle = (theme: MenuTheme) => ({
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderColor: theme.colors.border,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading themes...</p>
        </div>
      </div>
    );
  }

  if (!user || !outlet) {
    return null;
  }

  const hasChanges = selectedTheme !== currentTheme;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader outlet={outlet} onSignOut={handleSignOut} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/menu">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Themes</h1>
              <p className="text-gray-600">Choose a theme for your public menu page</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(`/menu/${outlet._id}`, '_blank')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Menu
              </Button>
              
              {hasChanges && (
                <Button
                  onClick={handleSaveTheme}
                  disabled={isSaving}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Theme
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <Palette className="h-5 w-5 mr-2" />
                    Current Theme
                  </CardTitle>
                  <CardDescription>
                    Your menu is currently using the {menuThemes.find(t => t.id === currentTheme)?.name} theme
                  </CardDescription>
                </div>
                {hasChanges && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Theme Selection Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuThemes.map((theme) => (
            <Card 
              key={theme.id} 
              className={`group cursor-pointer transition-all duration-300 border-2 ${
                selectedTheme === theme.id 
                  ? 'border-gray-900 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedTheme(theme.id)}
            >
              {/* Theme Preview */}
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img 
                  src={theme.preview} 
                  alt={`${theme.name} theme preview`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Theme Color Overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br opacity-80"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}20)`
                  }}
                />
                
                {/* Selected Indicator */}
                {selectedTheme === theme.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Current Theme Badge */}
                {currentTheme === theme.id && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-green-600 text-white border-0">
                      Current
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {theme.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {theme.description}
                  </p>
                </div>

                {/* Color Palette */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Color Palette</p>
                  <div className="flex space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.colors.accent }}
                      title="Accent"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.colors.surface }}
                      title="Surface"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.colors.vegIndicator }}
                      title="Veg Indicator"
                    />
                  </div>
                </div>

                {/* Typography Info */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Typography</p>
                  <p className="text-xs text-gray-600">
                    {theme.fonts.heading.split(',')[0]}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Save Button (Mobile) */}
        {hasChanges && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:hidden">
            <Button
              onClick={handleSaveTheme}
              disabled={isSaving}
              className="bg-gray-900 hover:bg-gray-800 shadow-lg px-8"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Theme
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}