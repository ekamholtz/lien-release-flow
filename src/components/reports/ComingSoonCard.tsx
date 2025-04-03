
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  PieChart, 
  LineChart, 
  BarChart, 
  GanttChart 
} from 'lucide-react';

interface ComingSoonCardProps {
  title: string;
  description: string;
  Icon?: string;  // Name of a Lucide icon
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({ title, description, Icon }) => {
  // Map icon name to the actual component
  const iconMap: Record<string, React.ReactNode> = {
    "PieChart": <PieChart className="w-12 h-12 text-muted-foreground mb-4" />,
    "LineChart": <LineChart className="w-12 h-12 text-muted-foreground mb-4" />,
    "BarChart": <BarChart className="w-12 h-12 text-muted-foreground mb-4" />,
    "GanttChart": <GanttChart className="w-12 h-12 text-muted-foreground mb-4" />
  };
  
  // Get the icon component based on the provided name
  const IconElement = Icon ? iconMap[Icon] : null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex flex-col items-center justify-center">
          {IconElement}
          <p className="text-muted-foreground">{title} detailed reports coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
};
