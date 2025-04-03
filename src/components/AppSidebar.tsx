
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CircleDollarSign, 
  FileText, 
  FileSignature, 
  Settings,
  Loader2,
  Users,
  PieChart,
  ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarLinkProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
};

const SidebarLink = ({ to, icon: Icon, label, isActive = false }: SidebarLinkProps) => (
  <Link 
    to={to} 
    className={cn(
      "nav-link",
      isActive ? "nav-link-active" : "nav-link-inactive"
    )}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </Link>
);

export function AppSidebar() {
  // In a real app, we would determine the active link based on the current route
  const activePath = "/";
  
  return (
    <div className="w-64 border-r bg-white flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-construction-600 flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-construction-900">PaymentFlow</span>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-4 space-y-1">
        <SidebarLink 
          to="/"
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={activePath === "/"}
        />
        <SidebarLink 
          to="/accounts-payable"
          icon={CircleDollarSign}
          label="Accounts Payable"
          isActive={activePath === "/accounts-payable"}
        />
        <SidebarLink 
          to="/accounts-receivable"
          icon={FileText}
          label="Accounts Receivable"
          isActive={activePath === "/accounts-receivable"}
        />
        <SidebarLink 
          to="/lien-release"
          icon={FileSignature}
          label="Lien Releases"
          isActive={activePath === "/lien-release"}
        />
        <SidebarLink 
          to="/reports"
          icon={PieChart}
          label="Reports"
          isActive={activePath === "/reports"}
        />
        <SidebarLink 
          to="/team"
          icon={Users}
          label="Team Members"
          isActive={activePath === "/team"}
        />
      </div>
      
      <div className="px-3 py-4 border-t">
        <SidebarLink 
          to="/settings"
          icon={Settings}
          label="Settings"
          isActive={activePath === "/settings"}
        />
      </div>
      
      <div className="p-4 border-t">
        <div className="p-3 bg-construction-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-construction-100 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-construction-500 animate-spin" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-construction-900">AI Assistant</h4>
              <p className="text-xs text-gray-500 mt-1">Need help? Ask me anything about your payments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
