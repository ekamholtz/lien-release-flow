
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { EntitySelector, EntityOption } from '../shared/EntitySelector';
import { getVendors, Vendor } from '@/services/vendorService';
import { VendorForm } from './VendorForm';

interface VendorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VendorSelector({ value, onChange, disabled = false }: VendorSelectorProps) {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const fetchVendors = async () => {
    if (!currentCompany?.id) {
      return;
    }
    
    setLoading(true);
    const data = await getVendors(currentCompany.id);
    setVendors(data);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchVendors();
  }, [currentCompany?.id]);
  
  const handleCreateSuccess = (vendor: Vendor) => {
    // Add the new vendor to the list and select it
    setVendors([...vendors, vendor]);
    onChange(vendor.id);
    setIsFormOpen(false);
  };
  
  const vendorOptions: EntityOption[] = vendors.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    description: vendor.email || undefined,
  }));
  
  return (
    <>
      <EntitySelector
        value={value}
        onChange={onChange}
        options={vendorOptions}
        placeholder="Select a vendor"
        emptyMessage="No vendors found"
        loading={loading}
        onCreateNew={() => setIsFormOpen(true)}
        createNewLabel="Add New Vendor"
        disabled={disabled}
      />
      
      <VendorForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
