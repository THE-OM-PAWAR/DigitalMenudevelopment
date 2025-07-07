'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Store, Settings, User, LogOut, Menu, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Outlet {
  _id: string;
  name: string;
  logo?: string;
}

interface DashboardHeaderProps {
  outlet?: Outlet;
  onSignOut: () => void;
}

export default function DashboardHeader({ outlet, onSignOut }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Outlet Logo and Name */}
          <div className="flex items-center space-x-3">
            {outlet ? (
              <>
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  {outlet.logo ? (
                    <img 
                      src={outlet.logo} 
                      alt={outlet.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <Store className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{outlet.name}</h1>
                  <p className="text-xs text-gray-500">Dashboard</p>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">MenuMaster</span>
              </div>
            )}
          </div>

          {/* Right side - Navigation and Profile */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            {outlet && (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/dashboard/menu">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <Menu className="h-4 w-4 mr-2" />
                    Menu
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-gray-900"
                  onClick={() => window.open(`/menu/${outlet._id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            )}

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user?.username} />
                    <AvatarFallback className="bg-gray-900 text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {outlet && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/outlet-settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}