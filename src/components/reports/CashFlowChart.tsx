
import React from 'react';
import { AreaChart } from '@/components/ui/charts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface CashFlowChartProps {
  data: Array<{
    name: string;
    Incoming: number;
    Outgoing: number;
  }>;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Incoming vs Outgoing payments over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <AreaChart 
            data={data}
            index="name"
            categories={["Incoming", "Outgoing"]}
            colors={["#10B981", "#EF4444"]}
            valueFormatter={(value) => `$${value.toLocaleString()}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
