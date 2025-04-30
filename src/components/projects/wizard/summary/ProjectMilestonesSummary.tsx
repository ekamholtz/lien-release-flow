
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface Milestone {
  name: string;
  description?: string;
  amount: number;
  dueDate?: Date | null;
  percentage?: number;
  dueType?: string;
}

interface ProjectMilestonesSummaryProps {
  milestones: Milestone[];
}

export function ProjectMilestonesSummary({ milestones }: ProjectMilestonesSummaryProps) {
  if (!milestones.length) return null;
  
  const totalMilestoneAmount = milestones.reduce(
    (sum, milestone) => sum + milestone.amount, 
    0
  );
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-500">Milestones ({milestones.length})</h4>
        <span className="text-sm font-medium">
          Total: ${totalMilestoneAmount.toLocaleString()}
        </span>
      </div>
      
      <div className="space-y-3 mt-3">
        {milestones.map((milestone, index) => (
          <div key={index} className="flex justify-between pb-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium">{milestone.name}</p>
              {milestone.dueDate && (
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(milestone.dueDate, 'MMM d, yyyy')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">${milestone.amount.toLocaleString()}</p>
              {milestone.percentage !== undefined && milestone.percentage > 0 && (
                <p className="text-xs text-gray-500">{milestone.percentage}%</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
