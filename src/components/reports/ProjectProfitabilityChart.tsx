
import React from 'react';
import { BarChart } from '@/components/ui/charts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface ProjectProfitabilityChartProps {
  data: Array<{
    name: string;
    profit: number;
  }>;
}

export const ProjectProfitabilityChart: React.FC<ProjectProfitabilityChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Profitability</CardTitle>
        <CardDescription>Weekly profit margins</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <BarChart 
            data={data}
            index="name"
            categories={["profit"]}
            colors={["#10B981"]}
            valueFormatter={(value) => `$${value.toLocaleString()}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
