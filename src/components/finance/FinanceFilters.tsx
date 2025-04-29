
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FinanceFiltersProps {
  onFilterChange: (projectId: string | null) => void;
  selectedProjectId: string | null;
}

export function FinanceFilters({ onFilterChange, selectedProjectId }: FinanceFiltersProps) {
  // Track counts of unassigned transactions
  const [unassignedCount, setUnassignedCount] = useState(0);
  
  // Get active projects for filtering
  const { data: projects = [] } = useQuery({
    queryKey: ["active-projects-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "active")
        .order("name")
        .limit(15);
        
      if (error) throw error;
      return data;
    },
  });
  
  // Get count of unassigned transactions
  const { data: unassignedData } = useQuery({
    queryKey: ["unassigned-transactions-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("legacy_unassigned_transactions")
        .select("id", { count: 'exact', head: true });
        
      if (error) throw error;
      return { count };
    },
  });
  
  // Update unassigned count when data loads
  useEffect(() => {
    if (unassignedData?.count !== undefined) {
      setUnassignedCount(unassignedData.count);
    }
  }, [unassignedData]);
  
  // More projects dropdown if we have more than 10
  const showMoreDropdown = projects.length > 10;
  const displayedProjects = showMoreDropdown ? projects.slice(0, 10) : projects;
  const moreProjects = showMoreDropdown ? projects.slice(10) : [];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Badge 
        variant={!selectedProjectId ? "secondary" : "outline"}
        className="cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onFilterChange(null)}
      >
        All
      </Badge>
      
      <Badge 
        variant={selectedProjectId === 'unassigned' ? "secondary" : "outline"}
        className="cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onFilterChange('unassigned')}
      >
        Unassigned {unassignedCount > 0 && `(${unassignedCount})`}
      </Badge>
      
      {/* Show first 10 projects */}
      {displayedProjects.map(project => (
        <Badge 
          key={project.id}
          variant={selectedProjectId === project.id ? "secondary" : "outline"}
          className="cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => onFilterChange(project.id)}
        >
          {project.name}
        </Badge>
      ))}
      
      {/* Dropdown for more projects */}
      {showMoreDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1">
              More <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {moreProjects.map(project => (
              <DropdownMenuItem 
                key={project.id}
                onClick={() => onFilterChange(project.id)}
              >
                {project.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
