"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Database, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  Menu,
  X,
  Globe,
  Bot,
  CreditCard,
  Brain,
  FileCode,
  FileText
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
  },
  {
    name: 'AI Configurations',
    href: '/ai-configurations',
    icon: Brain,
  },
  {
    name: 'Models',
    href: '/models',
    icon: Database,
  },
  {
    name: 'Workflows',
    href: '/workflows',
    icon: Bot,
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: FileText,
  },
  {
    name: 'Providers',
    href: '/providers',
    icon: Globe,
  },
  {
    name: 'Subscriptions',
    href: '/subscriptions',
    icon: CreditCard,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'System',
    href: '/system',
    icon: Settings,
  },
  {
    name: 'Firestore Schema',
    href: '/firestore-schema',
    icon: FileCode,
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 flex z-40 md:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-white" />
          <span className="ml-2 text-white text-lg font-semibold">
            Prompt Guru Admin
          </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-white space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium border-l-4 rounded-md'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}