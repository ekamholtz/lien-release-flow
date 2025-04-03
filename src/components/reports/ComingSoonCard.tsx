
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';

interface ComingSoonCardProps {
  title: string;
  description: string;
  Icon?: string;  // Making this optional with the name of a Lucide icon
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({ title, description, Icon }) => {
  // Dynamically render the specified Lucide icon if provided
  const IconComponent = Icon ? LucideIcons[Icon as keyof typeof LucideIcons] : null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex flex-col items-center justify-center">
          {IconComponent && <IconComponent className="w-12 h-12 text-muted-foreground mb-4" />}
          <p className="text-muted-foreground">{title} detailed reports coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
};
