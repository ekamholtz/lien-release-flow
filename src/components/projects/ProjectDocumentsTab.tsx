
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SearchBar } from './documents/SearchBar';
import { ProjectDocumentList } from './documents/ProjectDocumentList';
import { downloadDocument } from '@/services/documentService';

interface ProjectDocument {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  created_at: string;
}

interface ProjectDocumentsTabProps {
  projectId: string;
}

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<ProjectDocument[]>([]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load project documents');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (projectId) {
      fetchDocuments();
    }
  }, [projectId]);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(lowerSearchTerm) ||
      (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm))
    );
    
    setFilteredDocuments(filtered);
  }, [searchTerm, documents]);
  
  const handleDownload = async (document: ProjectDocument) => {
    await downloadDocument(document.file_path, document.name);
  };

  const handleDelete = async (document: ProjectDocument) => {
    try {
      // Show a loading toast
      toast.loading(`Deleting ${document.name}...`);
      
      // Delete from the database
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', document.id);
        
      if (error) throw error;
      
      // Also delete from storage if needed
      const { error: storageError } = await supabase
        .storage
        .from('project-documents')
        .remove([document.file_path]);
        
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue anyway as the database record is gone
      }
      
      // Update the local state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      
      // Show success message
      toast.success(`${document.name} deleted successfully`);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(`Failed to delete ${document.name}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        Loading project documents...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        <Button
          onClick={() => {
            // This would typically open an upload dialog
            // For now we'll just refresh the documents
            fetchDocuments();
          }}
        >
          Upload Document
        </Button>
      </div>
      
      <ProjectDocumentList 
        documents={filteredDocuments}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}
