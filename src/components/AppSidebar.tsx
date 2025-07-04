
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  FileText, 
  Receipt, 
  Users, 
  Building2, 
  FileBarChart,
  Settings,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Accounts Receivable', href: '/accounts-receivable', icon: ArrowDownCircle },
  { name: 'Accounts Payable', href: '/accounts-payable', icon: ArrowUpCircle },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Unsynced Transactions', href: '/unsynced-transactions', icon: AlertTriangle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-construction-50 text-construction-700 border-r-2 border-construction-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-construction-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
