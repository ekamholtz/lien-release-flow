import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Filter, Search } from 'lucide-react';
import { Input } from '../ui/input';

export interface ContractFiltersState {
  status?: string | null;
  searchTitle?: string | '';
}

interface ContractFiltersProps {
  onFilterChange: (filters: ContractFiltersState) => void;
  selectedFilters: ContractFiltersState;
}

export function ContractFilters({ onFilterChange, selectedFilters }: ContractFiltersProps) {
  const handleStatusChange = (status: string) => {
    onFilterChange({
      ...selectedFilters,
      status: status === 'inprogress' ? null : status
    });
  };

  const clearFilters = () => {
    onFilterChange({
      status: null,
      searchTitle: ''
    });
  };

  const hasAnyFilters = selectedFilters.status;

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {/* Search Title */}
      <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search title..."
          className="pl-8 w-full"
          value={selectedFilters.searchTitle}
          onChange={(e) =>
            onFilterChange({
              ...selectedFilters,
              searchTitle: e.target.value
            })
          }
        />
      </div>
      {/* Status Filter */}
      <Select value={selectedFilters.status || 'inprogress'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px] h-9">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inprogress">In Progress</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="declined">Declined</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasAnyFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          Clear Filters
        </Button>
      )}
    </div>
  );
}
