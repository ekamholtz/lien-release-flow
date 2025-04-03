
import React from 'react';
import { PieChart } from '@/components/ui/charts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface ExpensesByCategoryChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

export const ExpensesByCategoryChart: React.FC<ExpensesByCategoryChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses By Category</CardTitle>
        <CardDescription>Distribution of expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <PieChart 
            data={data}
            index="name"
            category="value"
            valueFormatter={(value) => `${value}%`}
            colors={["#3B82F6", "#10B981", "#F59E0B", "#6366F1"]}
          />
        </div>
      </CardContent>
    </Card>
  );
};
