
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ExpenseCategoryOption {
  value: string;
  label: string;
  isDefault?: boolean;
}

interface ExpenseCategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function ExpenseCategorySelector({ value, onChange, error }: ExpenseCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentCompany } = useCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Find selected item
  const selectedItem = categories.find((item) => item.value === value);

  useEffect(() => {
    if (currentCompany) {
      fetchCategories();
    }
  }, [currentCompany]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .or(`is_default.eq.true,company_id.eq.${currentCompany?.id || 'null'}`);

      if (error) {
        throw error;
      }

      const formattedCategories = data.map((category) => ({
        value: category.id,
        label: category.name,
        isDefault: category.is_default
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      toast.error('Failed to load expense categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    if (!currentCompany?.id) {
      toast.error('Please select a company first');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          name: newCategoryName.trim(),
          company_id: currentCompany.id,
          is_default: false
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const newCategory = {
          value: data[0].id,
          label: data[0].name,
          isDefault: false
        };
        
        setCategories([...categories, newCategory]);
        onChange(data[0].id);
        toast.success('Category created successfully');
        setNewCategoryName('');
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Error creating category:', err);
      toast.error('Failed to create category');
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            {selectedItem ? selectedItem.label : "Select category..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search category..." />
            <CommandEmpty>
              {isLoading ? 
                'Loading categories...' : 
                'No category found. Create a new one.'}
            </CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.label}
                  onSelect={() => {
                    onChange(category.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.label}
                  {category.isDefault && (
                    <span className="ml-auto text-xs text-muted-foreground">(Default)</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new category
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Expense Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Category Name</label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
