
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { toast } from 'sonner';
import { Document } from '@/hooks/useDocuments';

interface ProjectDocumentsProps {
  project: DbProject;
}

export function ProjectDocuments({ project }: ProjectDocumentsProps) {
  const [loading, setLoading] = useState(false);

  const { data: documents = [], refetch } = useQuery({
    queryKey: ['project-documents', project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Update the function to match the expected signature in DocumentsList
  // It should accept a single documentId parameter
  const handleDeleteDocument = (documentId: string) => {
    // Find the document to get its file path
    const documentToDelete = documents.find(doc => doc.id === documentId);
    if (documentToDelete) {
      deleteDocument(documentId, documentToDelete.file_path);
    } else {
      console.error('Document not found:', documentId);
    }
  };
  
  // Keep the original function with more parameters for actual implementation
  const deleteDocument = async (id: string, filePath?: string) => {
    setLoading(true);
    try {
      if (filePath) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePath]);
        
        if (storageError) throw storageError;
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      // Refresh documents list
      await refetch();
      
      toast.success('Document deleted successfully');
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document');
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete document' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Handler to get document URL
  const getDocumentUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      
      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Documents</h2>
      <DocumentsList 
        documents={documents as Document[]}
        loading={loading}
        onDeleteDocument={handleDeleteDocument}
        getDocumentUrl={getDocumentUrl}
      />
    </div>
  );
}
