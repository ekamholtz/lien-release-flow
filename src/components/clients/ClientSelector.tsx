
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { EntitySelector, EntityOption } from '../shared/EntitySelector';
import { getClients, Client } from '@/services/clientService';
import { ClientForm } from './ClientForm';

interface ClientSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ClientSelector({ value, onChange, disabled = false }: ClientSelectorProps) {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const fetchClients = async () => {
    if (!currentCompany?.id) {
      return;
    }
    
    setLoading(true);
    const data = await getClients(currentCompany.id);
    setClients(data);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchClients();
  }, [currentCompany?.id]);
  
  const handleCreateSuccess = (client: Client) => {
    // Add the new client to the list and select it
    setClients(prev => [...prev, client]);
    onChange(client.id);
    setIsFormOpen(false);
  };

  const handleCreateNew = (e: React.MouseEvent) => {
    // Stop event propagation to prevent dropdown from closing
    e.stopPropagation();
    e.preventDefault();
    
    // Open client form dialog
    setIsFormOpen(true);
  };
  
  const clientOptions: EntityOption[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    description: client.email || undefined,
  }));
  
  return (
    <>
      <EntitySelector
        value={value}
        onChange={onChange}
        options={clientOptions}
        placeholder="Select a client"
        emptyMessage="No clients found"
        loading={loading}
        onCreateNew={handleCreateNew}
        createNewLabel="Add New Client"
        disabled={disabled}
      />
      
      {/* Render the form outside any nested contexts to avoid portal conflicts */}
      {isFormOpen && (
        <ClientForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
}
