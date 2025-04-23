
import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, Filter, GridIcon, ListIcon } from 'lucide-react';
import { Input } from "@/components/ui/input";

export function ProjectFilters() {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search projects..."
          className="pl-8"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setView('grid')}>
          <GridIcon className={view === 'grid' ? 'text-primary' : ''} />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setView('list')}>
          <ListIcon className={view === 'list' ? 'text-primary' : ''} />
        </Button>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
    </div>
  );
}
