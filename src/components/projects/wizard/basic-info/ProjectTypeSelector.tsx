
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectGroup,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProjectType } from '@/types/project';
import { UseFormReturn } from 'react-hook-form';
import { ProjectBasicInfoFormValues } from './types';
import { PlusCircle } from 'lucide-react';

interface ProjectTypeSelectorProps {
  // Support both form-based and direct value/onChange patterns
  form?: UseFormReturn<any>;
  value?: string;
  onChange?: (value: string) => void;
  name?: string; // Field name when used with form
  projectTypes: ProjectType[];
  onCreateProjectType: () => void;
}

export function ProjectTypeSelector({
  form,
  value,
  onChange,
  name = "projectTypeId",
  projectTypes,
  onCreateProjectType
}: ProjectTypeSelectorProps) {
  // Handler for when a user selects the "Create New" option
  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "create-new") {
      // Call the create project type handler
      onCreateProjectType();
      // Keep the current value (don't change it to "create-new")
      return;
    }
    
    // Otherwise, update the value normally
    if (form) {
      form.setValue(name, selectedValue);
    } else if (onChange) {
      onChange(selectedValue);
    }
  };

  // If we're using the form pattern
  if (form) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Type</FormLabel>
            <div className="flex space-x-2">
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {projectTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    
                    {/* Add a separator and Create New option */}
                    <SelectSeparator />
                    <SelectItem value="create-new" className="text-primary">
                      <div className="flex items-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Project Type
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={onCreateProjectType}
              >
                +
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
  
  // If we're using the direct value/onChange pattern
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Project Type
      </label>
      <div className="flex space-x-2">
        <Select 
          value={value} 
          onValueChange={handleSelectChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {projectTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectGroup>
            
            {/* Add a separator and Create New option */}
            <SelectSeparator />
            <SelectItem value="create-new" className="text-primary">
              <div className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Project Type
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          onClick={onCreateProjectType}
        >
          +
        </Button>
      </div>
    </div>
  );
}
