
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, Trash, Edit, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useCompany } from '@/contexts/CompanyContext';
import { getClients, deleteClient, Client } from '@/services/clientService';
import { ClientForm } from '@/components/clients/ClientForm';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Clients = () => {
  const { currentCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClients = async () => {
    if (currentCompany?.id) {
      setLoading(true);
      const data = await getClients(currentCompany.id);
      setClients(data);
      setLoading(false);
    } else {
      setClients([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentCompany?.id]);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleClientSuccess = (client: Client) => {
    fetchClients();
  };
  
  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteClient(clientToDelete.id);
    setIsDeleting(false);
    
    if (success) {
      setIsDeleteDialogOpen(false);
      fetchClients();
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="w-full p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold">Clients</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleAddClient}
              className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Client</span>
            </Button>
          </div>
        </div>
        
        <div className="dashboard-card">
          {!currentCompany ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>Please select a company to manage clients.</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-construction-600" />
              <p className="text-gray-500">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-4 text-center">
              {searchTerm ? (
                <p>No clients matching "{searchTerm}"</p>
              ) : (
                <div className="p-8">
                  <p className="mb-4">You haven't added any clients yet.</p>
                  <Button 
                    onClick={handleAddClient}
                    className="bg-construction-600 hover:bg-construction-700"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Client
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="text-red-500 hover:text-red-700" 
                          onClick={() => handleDeleteClick(client)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      
      {/* Client Form Dialog */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleClientSuccess}
        initialData={selectedClient || undefined}
        isEditing={!!selectedClient}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client {clientToDelete?.name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-red-500 hover:bg-red-700 focus:ring-red-500"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Clients;
