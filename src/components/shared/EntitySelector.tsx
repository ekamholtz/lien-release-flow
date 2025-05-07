
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, PlusCircle, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  onCreateNew?: () => void;
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
    if (currentValue === 'create-new') {
      onCreateNew && onCreateNew();
      setOpen(false);
      return;
    }
    
    onChange(currentValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search...`} className="h-9" />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={handleSelect}
                >
                  <div className="flex flex-col">
                    <span>{option.name}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem 
                    value="create-new" 
                    onSelect={() => handleSelect('create-new')}
                    className="text-primary"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>{createNewLabel}</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
