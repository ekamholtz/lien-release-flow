import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Extend DbProject type to include original_value
interface ProjectWithOriginalValue {
  id: string;
  name: string;
  value: number;
  original_value?: number;
  created_at: string;
  description?: string;
  [key: string]: any; // Allow other properties from DbProject
}

interface ContractHistoryProps {
  project: ProjectWithOriginalValue;
}

export function ContractHistory({ project }: ContractHistoryProps) {
  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ['project-change-orders', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching change orders:', error);
        return [];
      }
      
      return data;
    }
  });

  // Calculate the original contract value
  // Check if original_value exists, if not use value
  const originalValue = project.original_value || project.value;

  // Calculate the current contract value based on original + change orders
  const currentValue = originalValue + (changeOrders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Contract History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Contract */}
        <div className="flex justify-between items-center p-3 rounded-md bg-muted/50">
          <div>
            <h4 className="font-medium">Original Contract</h4>
            <p className="text-sm text-muted-foreground">
              Created on {format(new Date(project.created_at), 'MMM d, yyyy')}
            </p>
            {project.description && (
              <p className="text-sm max-w-md mt-1 text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{formatCurrency(originalValue)}</p>
          </div>
        </div>

        {/* Change Orders */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading change orders...</div>
        ) : (
          <>
            {changeOrders && changeOrders.length > 0 ? (
              <div className="space-y-2">
                {changeOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 rounded-md border">
                    <div>
                      <div className="flex items-center">
                        {Number(order.amount) >= 0 ? (
                          <PlusCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <MinusCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <h4 className="font-medium">Change Order</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.date || order.created_at), 'MMM d, yyyy')}
                      </p>
                      {order.description && (
                        <p className="text-sm max-w-md mt-1 line-clamp-2">
                          {order.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${Number(order.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(order.amount) >= 0 ? '+' : ''}{formatCurrency(order.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No change orders yet</div>
            )}
          </>
        )}

        {/* Current Contract Value */}
        {changeOrders && changeOrders.length > 0 && (
          <div className="flex justify-between items-center p-3 rounded-md bg-primary/5 border border-primary/20 mt-4">
            <div>
              <h4 className="font-medium">Current Contract Value</h4>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{formatCurrency(currentValue)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
