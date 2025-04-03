
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CircleDollarSign, 
  FileText, 
  FileSignature, 
  Settings,
  Loader2,
  Users,
  PieChart,
  ArrowLeftRight,
  MessageSquareText,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  // Use the useLocation hook to get the current path
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navigationItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/accounts-payable", icon: CircleDollarSign, label: "Accounts Payable" },
    { to: "/accounts-receivable", icon: FileText, label: "Accounts Receivable" },
    { to: "/create-invoice", icon: FileText, label: "Create Invoice" },
    { to: "/create-bill", icon: Receipt, label: "Create Bill" },
    { to: "/lien-release", icon: FileSignature, label: "Lien Releases" },
    { to: "/reports", icon: PieChart, label: "Reports" },
    { to: "/team", icon: Users, label: "Team Members" },
  ];
  
  const settingsItems = [
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <Sidebar className="bg-cnstrct-navy">
      <SidebarHeader>
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-cnstrct-orange flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">PaymentFlow</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === item.to}
                    tooltip={item.label}
                    className={currentPath === item.to ? 
                      "bg-cnstrct-orange/20 text-cnstrct-orange" : 
                      "text-white hover:bg-cnstrct-lightblue/30"
                    }
                  >
                    <Link to={item.to}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === item.to}
                    tooltip={item.label}
                    className={currentPath === item.to ? 
                      "bg-cnstrct-orange/20 text-cnstrct-orange" : 
                      "text-white hover:bg-cnstrct-lightblue/30"
                    }
                  >
                    <Link to={item.to}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="p-4">
          <div className="p-3 bg-cnstrct-lightblue/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-cnstrct-orange/20 flex items-center justify-center">
                <MessageSquareText className="h-5 w-5 text-cnstrct-orange" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white">AI Assistant</h4>
                <p className="text-xs text-white/70 mt-1">Need help? Ask me anything about your payments.</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
