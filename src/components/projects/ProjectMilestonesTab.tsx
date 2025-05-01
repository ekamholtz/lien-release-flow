
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CircleDashed, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DbMilestone } from '@/lib/supabase';
import { useMilestoneCompletion } from '@/hooks/useMilestoneCompletion';

interface ProjectMilestonesTabProps {
  projectId: string;
}

export function ProjectMilestonesTab({ projectId }: ProjectMilestonesTabProps) {
  const { data: milestones, isLoading, refetch } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      // Cast the result to DbMilestone[] to handle the potentially missing company_id field
      return (data || []) as unknown as DbMilestone[];
    }
  });

  const { completeMilestone, isCompleting } = useMilestoneCompletion({
    onSuccess: () => refetch()
  });

  if (isLoading) {
    return <div className="py-6">Loading milestone data...</div>;
  }

  if (!milestones?.length) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No milestones found for this project.</p>
        </CardContent>
      </Card>
    );
  }

  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total milestone amount
  const totalAmount = milestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

  return (
    <div className="space-y-6">
      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{milestones.length} Milestones</div>
          <p className="text-sm text-muted-foreground">
            Total value: {formatCurrency(totalAmount)}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell>
                    <div className="font-medium">{milestone.name}</div>
                    {milestone.description && (
                      <div className="text-xs text-muted-foreground mt-1">{milestone.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{formatCurrency(milestone.amount)}</div>
                    {milestone.percentage && (
                      <div className="text-xs text-muted-foreground">{milestone.percentage}%</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {milestone.due_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(milestone.due_date), 'MMM d, yyyy')}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={milestone.is_completed ? "default" : "outline"}>
                      <div className="flex items-center gap-1">
                        {milestone.is_completed ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <CircleDashed className="h-3 w-3 mr-1" />
                        )}
                        {milestone.is_completed ? "Completed" : "Pending"}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {milestone.due_type === 'event' && !milestone.is_completed && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => completeMilestone(milestone)}
                        disabled={isCompleting}
                      >
                        {isCompleting ? 'Processing...' : 'Complete'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
