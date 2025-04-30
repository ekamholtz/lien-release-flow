
import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { ProjectType } from '@/types/project';

interface ProjectBasicInfoSummaryProps {
  name: string;
  client: string;
  location?: string;
  value: number;
  startDate: Date;
  endDate?: Date | null;
  projectType?: ProjectType | null;
}

export function ProjectBasicInfoSummary({
  name,
  client,
  location,
  value,
  startDate,
  endDate,
  projectType
}: ProjectBasicInfoSummaryProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 mb-2">Basic Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Project Name</p>
          <p className="text-sm text-gray-600">{name}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">Client</p>
          <p className="text-sm text-gray-600">{client}</p>
        </div>
        
        {location && (
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center">
              <MapPin className="h-4 w-4 mr-1" /> Location
            </p>
            <p className="text-sm text-gray-600">{location}</p>
          </div>
        )}
        
        <div className="space-y-1">
          <p className="text-sm font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-1" /> Contract Value
          </p>
          <p className="text-sm text-gray-600">${value.toLocaleString()}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-1" /> Start Date
          </p>
          <p className="text-sm text-gray-600">{format(startDate, 'PPP')}</p>
        </div>
        
        {endDate && (
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1" /> End Date
            </p>
            <p className="text-sm text-gray-600">{format(endDate, 'PPP')}</p>
          </div>
        )}
        
        {projectType && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Project Type</p>
            <p className="text-sm text-gray-600">{projectType.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
