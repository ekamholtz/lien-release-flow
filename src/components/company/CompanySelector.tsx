
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Building, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import { useNavigate } from 'react-router-dom';

export function CompanySelector() {
  const navigate = useNavigate();
  const { currentCompany, companies, switchCompany } = useCompany();
  const { createCompany } = useCompanies();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateCompany = async () => {
    if (!companyName.trim()) return;
    
    try {
      setIsCreating(true);
      const newCompany = await createCompany.mutateAsync(companyName);
      await switchCompany(newCompany.id);
      setIsCreateDialogOpen(false);
      setCompanyName('');
    } finally {
      setIsCreating(false);
    }
  };
  
  if (!currentCompany) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate('/onboarding/company')}
        className="gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Create Company
      </Button>
    );
  }
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Building className="h-4 w-4" />
            {currentCompany.name}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Companies</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => switchCompany(company.id)}
              className="flex items-center justify-between"
            >
              {company.name}
              {company.id === currentCompany.id && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Company
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Create a new company to manage projects, invoices, and team members.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={!companyName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
