
import { useState, useEffect } from 'react';
import { Check, ChevronDown, PlusCircle, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface EntityOption {
  id: string;
  name: string;
  label?: string;
  description?: string;
}

interface EntitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: EntityOption[];
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  onCreateNew?: (e: React.MouseEvent) => void;
  createNewLabel?: string;
  disabled?: boolean;
}

export function EntitySelector({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  emptyMessage = "No options available",
  loading = false,
  onCreateNew,
  createNewLabel = "Create New",
  disabled = false,
}: EntitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<EntityOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Find the selected option when value changes
  useEffect(() => {
    if (value) {
      const selectedOption = options.find(option => option.id === value);
      setSelected(selectedOption || null);
    } else {
      setSelected(null);
    }
  }, [value, options]);

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find(option => option.id === currentValue);
    if (selectedOption) {
      onChange(currentValue);
      setOpen(false);
    }
  };

  const handleCreateNewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onCreateNew) {
      onCreateNew(e);
    }
    setOpen(false);
  };

  // Filter options based on search query
  const filteredOptions = searchQuery 
    ? options.filter(option => 
        option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[--radix-dropdown-menu-trigger-width] p-0" 
        align="start"
        style={{ 
          zIndex: 9999, // Increase z-index to ensure visibility
          minWidth: '200px',
        }}
      >
        <div className="p-2">
          <input
            placeholder="Search..."
            className="w-full border rounded p-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {loading ? (
          <DropdownMenuLabel>Loading...</DropdownMenuLabel>
        ) : filteredOptions.length === 0 ? (
          <DropdownMenuLabel>{emptyMessage}</DropdownMenuLabel>
        ) : (
          <>
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filteredOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="cursor-pointer pointer-events-auto"
              >
                <div className="flex flex-col flex-1">
                  <span>{option.name}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  )}
                </div>
                {value === option.id && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {onCreateNew && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-primary cursor-pointer pointer-events-auto"
              onClick={handleCreateNewClick}
            >
              <div className="flex items-center w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>{createNewLabel}</span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
