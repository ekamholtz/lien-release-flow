
import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { AiAssistant } from '@/components/dashboard/AiAssistant';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DbBill, BillStatus } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { PayBill } from '@/components/payments/PayBill';
import { BillsTable } from '@/components/payments/BillsTable';

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
  const navigate = useNavigate();

  const fetchBills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bills')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });
      
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
  }, []);

  const handleUpdateStatus = async (billId: string, newStatus: BillStatus) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: newStatus })
        .eq('id', billId);
        
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

  return (
    <AppLayout>
      <div className="w-full p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Accounts Payable</h1>
          <div className="ml-auto">
            <Button 
              onClick={() => navigate('/create-bill')}
              className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Bill</span>
            </Button>
          </div>
        </div>
        
        <div className="dashboard-card mb-6">
          <h2 className="text-lg font-semibold mb-4">Bills</h2>
          
          {loading ? (
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
            />
          )}
        </div>
      </div>
      
      {selectedBill && (
        <PayBill
          bill={selectedBill}
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          onPaymentComplete={() => {
            fetchBills();
            setSelectedBill(null);
          }}
        />
      )}
      
      <AiAssistant />
    </AppLayout>
  );
};

export default AccountsPayable;
