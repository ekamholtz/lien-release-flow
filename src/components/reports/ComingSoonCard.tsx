
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface ComingSoonCardProps {
  title: string;
  description: string;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({ title, description }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">{title} detailed reports coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
};
