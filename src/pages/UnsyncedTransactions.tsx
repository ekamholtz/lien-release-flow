
import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UnsyncedTransaction {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  error_message: string | null;
  last_synced_at: string | null;
  created_at: string;
  // Entity-specific data
  entity_data?: any;
}

const UnsyncedTransactions = () => {
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState('all');
  const [isRetrying, setIsRetrying] = useState(false);

  const { data: unsyncedTransactions = [], isLoading, refetch } = useQuery({
    queryKey: ['unsynced-transactions', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data: syncRecords, error } = await supabase
        .from('accounting_sync')
        .select('*')
        .neq('status', 'success')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional entity data for each transaction
      const enrichedData = await Promise.all(
        (syncRecords || []).map(async (record) => {
          let entityData = null;
          
          try {
            if (record.entity_type === 'invoice') {
              const { data } = await supabase
                .from('invoices')
                .select('invoice_number, client_name, amount, due_date')
                .eq('id', record.entity_id)
                .single();
              entityData = data;
            } else if (record.entity_type === 'bill') {
              const { data } = await supabase
                .from('bills')
                .select('bill_number, vendor_name, amount, due_date')
                .eq('id', record.entity_id)
                .single();
              entityData = data;
            } else if (record.entity_type === 'vendor') {
              const { data } = await supabase
                .from('vendors')
                .select('name, email')
                .eq('id', record.entity_id)
                .single();
              entityData = data;
            }
          } catch (err) {
            console.error(`Error fetching entity data for ${record.entity_type}:`, err);
          }

          return {
            ...record,
            entity_data: entityData
          } as UnsyncedTransaction;
        })
      );

      return enrichedData;
    },
    enabled: !!currentCompany?.id
  });

  const handleRetryAll = async () => {
    setIsRetrying(true);
    try {
      toast.info('Retrying all failed syncs...');
      
      const endpoints = [
        'qbo-sync-retry',
        'qbo-bill-sync-retry', 
        'qbo-vendor-sync-retry',
        'qbo-payment-sync-retry'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(
            `https://oknofqytitpxmlprvekn.functions.supabase.co/${endpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              },
              body: JSON.stringify({})
            }
          );
          
          if (!response.ok) {
            console.error(`Failed to retry ${endpoint}`);
          }
        } catch (endpointError) {
          console.error(`Error with ${endpoint}:`, endpointError);
        }
      }
      
      toast.success('Retry initiated for all failed syncs');
      
      // Refresh data after a delay
      setTimeout(() => {
        refetch();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error retrying syncs:', err);
      toast.error(`Retry error: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      pending: 'secondary',
      processing: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const filteredTransactions = unsyncedTransactions.filter(transaction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'error') return transaction.status === 'error';
    if (activeTab === 'pending') return ['pending', 'processing'].includes(transaction.status);
    return transaction.entity_type === activeTab;
  });

  const stats = {
    total: unsyncedTransactions.length,
    error: unsyncedTransactions.filter(t => t.status === 'error').length,
    pending: unsyncedTransactions.filter(t => ['pending', 'processing'].includes(t.status)).length,
    invoices: unsyncedTransactions.filter(t => t.entity_type === 'invoice').length,
    bills: unsyncedTransactions.filter(t => t.entity_type === 'bill').length,
    vendors: unsyncedTransactions.filter(t => t.entity_type === 'vendor').length
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Unsynced Transactions</h1>
            <p className="text-gray-500 mt-1">
              Manage transactions that haven't synced to QuickBooks Online
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleRetryAll}
              disabled={isRetrying || stats.error === 0}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry All Failed
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Unsynced</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-construction-600">{stats.invoices}</div>
              <div className="text-sm text-gray-500">Invoices</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-construction-600">{stats.bills}</div>
              <div className="text-sm text-gray-500">Bills</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-construction-600">{stats.vendors}</div>
              <div className="text-sm text-gray-500">Vendors</div>
            </CardContent>
          </Card>
        </div>

        {stats.total === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Synced!</h3>
              <p className="text-gray-500">All transactions are successfully synced to QuickBooks Online.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Unsynced Transactions</CardTitle>
              <CardDescription>
                Review and manage transactions that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="error">Failed ({stats.error})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="invoice">Invoices ({stats.invoices})</TabsTrigger>
                  <TabsTrigger value="bill">Bills ({stats.bills})</TabsTrigger>
                  <TabsTrigger value="vendor">Vendors ({stats.vendors})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(transaction.status)}
                              <span className="font-medium capitalize">
                                {transaction.entity_type}
                              </span>
                              {getStatusBadge(transaction.status)}
                            </div>
                            
                            {transaction.entity_data && (
                              <div className="text-sm text-gray-600 mb-2">
                                {transaction.entity_type === 'invoice' && (
                                  <>
                                    <span className="font-medium">
                                      {transaction.entity_data.invoice_number}
                                    </span>
                                    {' - '}
                                    {transaction.entity_data.client_name}
                                    {' - '}
                                    ${transaction.entity_data.amount}
                                  </>
                                )}
                                {transaction.entity_type === 'bill' && (
                                  <>
                                    <span className="font-medium">
                                      {transaction.entity_data.bill_number}
                                    </span>
                                    {' - '}
                                    {transaction.entity_data.vendor_name}
                                    {' - '}
                                    ${transaction.entity_data.amount}
                                  </>
                                )}
                                {transaction.entity_type === 'vendor' && (
                                  <>
                                    <span className="font-medium">
                                      {transaction.entity_data.name}
                                    </span>
                                    {transaction.entity_data.email && (
                                      <>
                                        {' - '}
                                        {transaction.entity_data.email}
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-gray-400">
                              Created: {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                              {transaction.last_synced_at && (
                                <>
                                  {' • '}
                                  Last sync: {format(new Date(transaction.last_synced_at), 'MMM d, yyyy HH:mm')}
                                </>
                              )}
                            </div>

                            {transaction.error_message && (
                              <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  {transaction.error_message}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredTransactions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No transactions found for the selected filter.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default UnsyncedTransactions;
