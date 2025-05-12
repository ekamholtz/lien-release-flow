
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useProjects } from '@/hooks/useProjects';
import { Calendar, User, Filter } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useCompanyMembers } from '@/hooks/useCompanyMembers';
import { format } from "date-fns";

interface FinanceFiltersProps {
  onFilterChange: (filters: {
    projectId: string | null,
    dateRange: { from: Date | null, to: Date | null } | null,
    projectManagerId: string | null
  }) => void;
  selectedFilters: {
    projectId: string | null,
    dateRange: { from: Date | null, to: Date | null } | null,
    projectManagerId: string | null
  };
}

export function FinanceFilters({ onFilterChange, selectedFilters }: FinanceFiltersProps) {
  const { projects } = useProjects();
  const { members } = useCompanyMembers();
  const [date, setDate] = useState<{
    from: Date | null,
    to: Date | null
  }>(selectedFilters.dateRange || { from: null, to: null });

  const projectManagers = members.filter(member => 
    member.role === 'project_manager' || member.role === 'company_owner'
  );

  const handleDateChange = (newDate: { from: Date | null, to: Date | null }) => {
    setDate(newDate);
    onFilterChange({
      ...selectedFilters,
      dateRange: newDate
    });
  };

  const handleProjectChange = (projectId: string) => {
    onFilterChange({
      ...selectedFilters,
      projectId: projectId === 'all' ? null : projectId
    });
  };

  const handleProjectManagerChange = (managerId: string) => {
    onFilterChange({
      ...selectedFilters,
      projectManagerId: managerId === 'all' ? null : managerId
    });
  };

  const clearFilters = () => {
    setDate({ from: null, to: null });
    onFilterChange({
      projectId: null,
      dateRange: null,
      projectManagerId: null
    });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={selectedFilters.dateRange ? "default" : "outline"}
            size="sm" 
            className="h-9"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {selectedFilters.dateRange?.from ? (
              selectedFilters.dateRange.to ? (
                <>
                  {format(selectedFilters.dateRange.from, "MMM d")} - 
                  {format(selectedFilters.dateRange.to, "MMM d")}
                </>
              ) : (
                format(selectedFilters.dateRange.from, "MMM d")
              )
            ) : (
              "Date Range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={date?.from || new Date()}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Project Filter */}
      <Select 
        value={selectedFilters.projectId || 'all'} 
        onValueChange={handleProjectChange}
      >
        <SelectTrigger className="w-[180px] h-9">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select Project" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Project Manager Filter */}
      <Select 
        value={selectedFilters.projectManagerId || 'all'} 
        onValueChange={handleProjectManagerChange}
      >
        <SelectTrigger className="w-[200px] h-9">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select Project Manager" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Project Managers</SelectItem>
          {projectManagers.map((manager) => (
            <SelectItem key={manager.id} value={manager.id}>
              {`${manager.first_name} ${manager.last_name}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear All Filters */}
      {(selectedFilters.projectId || selectedFilters.dateRange || selectedFilters.projectManagerId) && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters} 
          className="h-9"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
