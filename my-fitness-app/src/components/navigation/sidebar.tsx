'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Dumbbell, 
  Calendar, 
  User, 
  LogOut,
  Settings,
  Shield,
  Users as UsersIcon,
  Menu,
  X,
  Activity,
  BarChart2
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['client', 'trainer', 'admin'] },
  { name: 'Programs', href: '/programs', icon: Dumbbell, roles: ['client', 'trainer', 'admin'] },
  { name: 'Workouts', href: '/workouts', icon: Calendar, roles: ['trainer', 'admin', 'client'] },
  { name: 'Progress', href: '/progress', icon: BarChart2, roles: ['client', 'trainer', 'admin'] },
  { name: 'Nutrition', href: '/nutrition', icon: Activity, roles: ['client', 'trainer', 'admin'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart2, roles: ['client', 'trainer', 'admin'] },
  { name: 'Clients', href: '/clients', icon: UsersIcon, roles: ['trainer', 'admin'] },
  { name: 'Admin', href: '/admin', icon: Shield, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    setIsMobileOpen(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'trainer':
        return 'Trainer';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-3">
          <Dumbbell className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">FitnessPro</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {user && (
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {user.first_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.first_name} {user.last_name}
              </p>
              <div className="flex items-center mt-1">
                <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.name === 'Admin' && (
                    <Shield className="h-4 w-4 text-red-500 ml-auto" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t">
        <div className="space-y-2">
          <Link
            href="/settings"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Configurações</span>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsMobileOpen(false)} 
          />
          <div className="relative flex flex-col w-80 max-w-sm bg-white h-full shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
        <SidebarContent />
      </div>
    </>
  );
}
