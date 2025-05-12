import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DbBill, BillStatus } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { PayBill } from '@/components/payments/PayBill';
import { BillsTable } from '@/components/payments/BillsTable';
import { BillDetailsModal } from '@/components/payments/BillDetailsModal';
import { FinanceFilters, FinanceFiltersState } from '@/components/finance/FinanceFilters';
import { useCompany } from '@/contexts/CompanyContext';

// Define an extended bill type that includes the project name from the join
type ExtendedBill = DbBill & {
  projects?: { 
    name: string;
  };
};

const AccountsPayable = () => {
  const [bills, setBills] = useState<ExtendedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<ExtendedBill | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState<FinanceFiltersState>({
    projectId: null,
    dateRange: null,
    projectManagerId: null
  });
  const navigate = useNavigate();
  const { currentCompany } = useCompany();

  const fetchBills = async () => {
    try {
      setLoading(true);
      
      // If no company is selected, don't fetch any data
      if (!currentCompany?.id) {
        setBills([]);
        setLoading(false);
        return;
      }
      
      // Always filter by company_id first
      let query = supabase
        .from('bills')
        .select('*, projects(name)')
        .eq('company_id', currentCompany.id);
        
      // Apply project filter if selected
      if (filters.projectId === 'unassigned') {
        query = query.is('project_id', null);
      } else if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      
      // Apply project manager filter if specified
      if (filters.projectManagerId) {
        query = query.eq('project_manager_id', filters.projectManagerId);
      }
      
      // Apply date range filter if specified
      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Bills data:', data);
      setBills(data as ExtendedBill[] || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to load bills. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filters, currentCompany?.id]);

  const handleUpdateStatus = async (billId: string, newStatus: BillStatus) => {
    if (!currentCompany?.id) {
      toast({
        title: "No Company Selected",
        description: "Please select a company first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: newStatus })
        .eq('id', billId)
        .eq('company_id', currentCompany.id);
        
      if (error) throw error;
      
      setBills(bills.map(bill => 
        bill.id === billId 
          ? { ...bill, status: newStatus } 
          : bill
      ));
      
      toast({
        title: `Bill ${newStatus}`,
        description: `The bill has been ${newStatus}`,
      });
    } catch (error) {
      console.error(`Error updating bill status to ${newStatus}:`, error);
      toast({
        title: "Error",
        description: `Failed to update bill status`,
        variant: "destructive"
      });
    }
  };
  
  const handlePayBill = (bill: ExtendedBill) => {
    if (!currentCompany?.id) {
      toast({
        title: "No Company Selected",
        description: "Please select a company first",
        variant: "destructive"
      });
      return;
    }
    
    if (bill.status !== 'approved') {
      toast({
        title: "Cannot Process Payment",
        description: "Only approved bills can be paid",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedBill(bill);
    setIsPaymentDialogOpen(true);
  };
  
  const handleViewDetails = (bill: ExtendedBill) => {
    setSelectedBill(bill);
    setIsDetailsModalOpen(true);
  };

  const handleFilterChange = (newFilters: FinanceFiltersState) => {
    setFilters(newFilters);
  };

  return (
    <AppLayout>
      <div className="w-full p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Accounts Payable</h1>
          <div className="ml-auto">
            <Button 
              onClick={() => navigate('/bills/create')}
              className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Bill</span>
            </Button>
          </div>
        </div>
        
        <FinanceFilters 
          onFilterChange={handleFilterChange}
          selectedFilters={filters}
        />
        
        <div className="dashboard-card mb-6">
          <h2 className="text-lg font-semibold mb-4">Bills</h2>
          
          {!currentCompany ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>Please select a company to view bills.</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>No bills to display. Use the "New Bill" button to add payment requests.</p>
            </div>
          ) : (
            <BillsTable 
              bills={bills} 
              onUpdateStatus={handleUpdateStatus} 
              onPayBill={handlePayBill}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>
      </div>
      
      {selectedBill && (
        <>
          <PayBill
            bill={selectedBill}
            isOpen={isPaymentDialogOpen}
            onClose={() => setIsPaymentDialogOpen(false)}
            onPaymentComplete={() => {
              fetchBills();
              setSelectedBill(null);
            }}
          />
          
          <BillDetailsModal
            bill={selectedBill}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />
        </>
      )}
    </AppLayout>
  );
};

export default AccountsPayable;
