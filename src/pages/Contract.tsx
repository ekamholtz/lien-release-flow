import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContractDetailsModal } from '@/components/contracts/ContractDetailsModal';
import { useCompany } from '@/contexts/CompanyContext';
import { ContractsTable } from '@/components/contracts/ContractsTable';
import { ContractFilters, ContractFiltersState } from '@/components/contracts/ContractFilters';
import { ExtendedContract } from '@/types/contract';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const Contract = () => {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [contracts, setContracts] = useState<ExtendedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<ExtendedContract | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState<ContractFiltersState>({
    status: null,
    searchTitle: ''
  });
  const [rawContracts, setRawContracts] = useState<ExtendedContract[]>([]);
  const [sortKey, setSortKey] = useState<'title' | 'owner' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let filtered = [...rawContracts];

    if (filters.searchTitle) {
      const search = filters.searchTitle.toLowerCase();
      filtered = filtered.filter((contract) => {
        const titleMatch = contract.title?.toLowerCase().includes(search);
        const signerMatch = contract.signers?.some((signer) =>
          signer.name?.toLowerCase().includes(search) ||
          signer.email?.toLowerCase().includes(search)
        );
        return titleMatch || signerMatch;
      });
    }

    filtered.sort((a, b) => {
      const aVal = a[sortKey]?.toString().toLowerCase() || '';
      const bVal = b[sortKey]?.toString().toLowerCase() || '';
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setContracts(filtered);
  }, [filters.searchTitle, rawContracts, sortKey, sortOrder]);

  const fetchContractsFromEdge = async (status: string = 'inprogress') => {
    try {
      const { data, error } = await supabase.functions.invoke('get-contract-document-list', {
        body: { status },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error calling edge function:', err);
      toast.error('Failed to load contracts.');
      return null;
    }
  };


  const fetchContracts = async () => {
    try {
      setLoading(true);

      if (!currentCompany?.id) {
        setContracts([]);
        return;
      }

      const status = filters.status || 'inprogress';
      const data = await fetchContractsFromEdge(status);
      let contractsList: ExtendedContract[] = [];

      if (Array.isArray(data)) {
        contractsList = data;
      } else if (data?.result && Array.isArray(data.result)) {
        contractsList = data.result;
      }
      setRawContracts(contractsList);
      // if (Array.isArray(data)) {
      //   setContracts(data);
      // } else if (data?.result && Array.isArray(data.result)) {
      //   setContracts(data.result);
      // } else {
      //   setContracts([]);
      // }

    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error("Failed to load contracts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [filters, currentCompany?.id]);

  const handleViewDetails = (contract: ExtendedContract) => {
    checkStatus(contract.objectId);
    setIsDetailsModalOpen(true);
  };
  const handleDelete = async (contract: ExtendedContract) => {

    if (!contract.objectId) return;
    const confirmed = window.confirm(`Are you sure you want to delete this contract "${contract.title}"?`);
    if (!confirmed) return;

    try {
      const { data, error } = await supabase.functions.invoke("remove-contract", {
        body: { documentId: contract.objectId },
      });

      if (data.deletedAt) {
        toast.success('Deleted the contract.');
        await fetchContracts();
        return;
      }
      if (error) {
        toast.error('Failed to load contracts.');
        console.error("Supabase function error:", error);
        return;
      }

    } catch (err) {
      console.error("Status check error catch:", err);
    }
  };

  const checkStatus = async (agreementId: string) => {
    if (!agreementId) return;

    try {
      const { data, error } = await supabase.functions.invoke("get-contract-details", {
        body: { documentId: agreementId },
      });

      if (error) {
        console.error("Supabase function error:", error);
        return;
      }

      if (data?.status === "completed") {
        setSelectedContract(data);
        // setSignedUrl(data.downloadUrl);
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const handleFilterChange = (newFilters: ContractFiltersState) => {
    setFilters(newFilters);
  };

  return (
    <AppLayout>
      <div className="w-full p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Contracts</h1>

          <div className="ml-auto">
            <Button
              onClick={() => navigate('/contract/create')}
              className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Contract</span>
            </Button>
          </div>
        </div>

        <ContractFilters
          onFilterChange={handleFilterChange}
          selectedFilters={filters}
        />

        <div className="dashboard-card mb-6">
          <h2 className="text-lg font-semibold mb-4">All Contracts</h2>

          {!currentCompany ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>Please select a company to view contracts.</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>No contracts to display. Use the "New Contract" button to add new contract.</p>
            </div>
          ) : (
            <ContractsTable
              contracts={contracts}
              onViewDetails={handleViewDetails}
              onDelete={handleDelete}
              onSortChange={(key) => {
                if (key === sortKey) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortKey(key);
                  setSortOrder('asc');
                }
              }}
              sortKey={sortKey}
              sortOrder={sortOrder}
            />
          )}
        </div>
      </div>

      {selectedContract && (
        <>
          <ContractDetailsModal
            contract={selectedContract}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />
        </>
      )}
    </AppLayout>
  );
};

export default Contract;
