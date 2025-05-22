import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load categories when component mounts or company changes
  useEffect(() => {
    fetchCategories();
  }, [currentCompany]);

  const fetchCategories = async () => {
    if (!currentCompany?.id) return;
    
    setIsLoading(true);
    try {
      // Always fetch default categories
      const defaultQuery = supabase
        .from('expense_categories')
        .select('*')
        .eq('is_default', true);
        
      // If we have a company, also fetch company-specific categories
      let query = defaultQuery;
      
      if (currentCompany?.id) {
        query = supabase
          .from('expense_categories')
          .select('*')
          .or(`is_default.eq.true,company_id.eq.${currentCompany.id}`);
      }
      
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Initialize with empty array if data is null or undefined
      const categoriesData = data || [];
      const formattedCategories = categoriesData.map((category) => ({
        value: category.id,
        label: category.name,
        isDefault: category.is_default
      }));

      // Sort categories to show default categories first
      formattedCategories.sort((a, b) => {
        // Default categories first
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        // Then alphabetically by name
        return a.label.localeCompare(b.label);
      });

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
        
        setCategories(prev => [...prev, newCategory]);
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
    <div className="relative">
      {isLoading ? (
        <div className="flex items-center border rounded-md p-2 h-10">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <Select
          value={value || ""}
          onValueChange={onChange}
          disabled={isLoading || categories.length === 0}
        >
          <SelectTrigger className={error ? "border-red-500" : ""}>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem 
                key={category.value} 
                value={category.value}
              >
                {category.label}
                {category.isDefault && (
                  <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                )}
              </SelectItem>
            ))}
            <div className="p-1">
              <Button
                type="button"
                variant="ghost"
                className="w-full flex items-center justify-start px-2 py-1.5 text-sm"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new category
              </Button>
            </div>
          </SelectContent>
        </Select>
      )}

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
    </div>
  );
}
