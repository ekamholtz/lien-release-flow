
import React from 'react';
import { FormControl } from "@/components/ui/form";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Sample projects data - in a real app, this would likely come from an API
const projects = [
  { id: "proj-1", name: "Office Renovation - Downtown" },
  { id: "proj-2", name: "Residential Complex - Westside" },
  { id: "proj-3", name: "Hospital Expansion - North Campus" },
  { id: "proj-4", name: "Shopping Mall - Eastgate" },
  { id: "proj-5", name: "School Auditorium - Central High" },
  { id: "proj-6", name: "Highway Bridge Repair - Route 95" },
  { id: "proj-7", name: "Corporate Headquarters - Tech Park" },
  { id: "proj-8", name: "Municipal Park - Riverside" },
];

interface ProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background font-normal"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value
                ? projects.find((project) => project.name === value)?.name
                : "Select project..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent
        className="w-full min-w-[var(--radix-popper-anchor-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  {project.name}
                  {value === project.name && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
