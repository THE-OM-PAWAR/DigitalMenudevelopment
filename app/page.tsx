import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Menu, QrCode, Users, TrendingUp, Shield, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">MenuMaster</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gray-900 text-white hover:bg-gray-800 font-medium px-6">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Digital Menu
              <span className="block text-orange-500">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create beautiful digital menus in minutes. No complexity, just results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-4 text-lg font-medium">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-medium">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple tools for modern restaurants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Menu className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-lg font-semibold">Menu Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Add items, photos, and pricing with ease
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-lg font-semibold">QR Codes</CardTitle>
                <CardDescription className="text-gray-600">
                  Instant access for your customers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-lg font-semibold">Analytics</CardTitle>
                <CardDescription className="text-gray-600">
                  Track performance and insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-lg font-semibold">Team Access</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage multiple outlets and staff
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-lg font-semibold">Secure</CardTitle>
                <CardDescription className="text-gray-600">
                  Enterprise-grade security
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Store className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-lg font-semibold">Multi-Outlet</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage all locations centrally
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">Free</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$0</div>
                <CardDescription className="text-gray-600 mt-2">Perfect to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">1 Outlet</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Unlimited Items</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">QR Codes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Basic Analytics</span>
                </div>
                <Link href="/auth/signup" className="block pt-4">
                  <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-500 bg-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$29</div>
                <CardDescription className="text-gray-600 mt-2">For growing businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Unlimited Outlets</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Advanced Analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Team Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Priority Support</span>
                </div>
                <Link href="/auth/signup" className="block pt-4">
                  <Button className="w-full bg-orange-500 text-white hover:bg-orange-600">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to go digital?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of restaurants using MenuMaster
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">MenuMaster</span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2024 MenuMaster. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}