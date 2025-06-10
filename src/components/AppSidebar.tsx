
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  ArrowLeftRight, 
  ArrowDownToLine, 
  FileText, 
  Settings, 
  Users, 
  BarChart3, 
  LogOut,
  Files,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { CNSTRCTLogo } from '@/components/ui/cnstrct-logo';

export function AppSidebar() {
  const { signOut } = useAuth();
  
  const links = [
    { to: '/dashboard', icon: <Home className="h-5 w-5" />, text: 'Dashboard' },
    { to: '/projects', icon: <LayoutDashboard className="h-5 w-5" />, text: 'Projects' },
    { to: '/bills', icon: <ArrowLeftRight className="h-5 w-5" />, text: 'Accounts Payable' },
    { to: '/invoices', icon: <ArrowDownToLine className="h-5 w-5" />, text: 'Accounts Receivable' },
    { to: '/documents', icon: <Files className="h-5 w-5" />, text: 'Documents' },
    { to: '/team', icon: <Users className="h-5 w-5" />, text: 'Team' },
    { to: '/reports', icon: <BarChart3 className="h-5 w-5" />, text: 'Reports' },
    { to: '/settings', icon: <Settings className="h-5 w-5" />, text: 'Settings' },
    { to: '/contract', icon: <FileText className="h-5 w-5" />, text: 'Contracts' },
  ];

  return (
    <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-50 md:w-60">
      <ScrollArea className="flex flex-col h-full bg-cnstrct-navy border-r border-cnstrct-navy">
        <div className="flex flex-col h-full py-4">
          <div className="px-4 py-3">
            <CNSTRCTLogo className="mb-4" />
            <h2 className="px-3 text-lg font-semibold text-white">Navigation</h2>
          </div>
          <div className="flex-1">
            <nav className="grid gap-1 px-3">
              {links.map((link) => (
                <NavLink 
                  key={link.to} 
                  to={link.to} 
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10",
                    isActive ? "bg-cnstrct-orange/20 text-white" : "text-gray-300"
                  )}
                >
                  {link.icon}
                  {link.text}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="px-3 py-2">
            <Separator className="my-2 bg-white/20" />
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-300 hover:bg-white/10 hover:text-red-200"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log out
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
