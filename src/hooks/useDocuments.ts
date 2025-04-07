
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Document = {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setDocuments([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File, 
    name: string, 
    description?: string, 
    category?: string, 
    tags?: string[]
  ) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to upload documents');
      }
      
      // Create a unique file path to avoid conflicts
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Insert metadata into documents table
      const { error: insertError } = await supabase.from('documents').insert({
        name,
        description,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category,
        tags,
        user_id: user.id
      });
      
      if (insertError) throw insertError;
      
      // Refresh documents list
      await fetchDocuments();
      
      return { success: true };
    } catch (err) {
      console.error('Error uploading document:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to upload document' 
      };
    }
  };

  const deleteDocument = async (id: string, filePath: string) => {
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Then delete metadata from documents table
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      // Refresh documents list
      await fetchDocuments();
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting document:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete document' 
      };
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // URL valid for 1 hour
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data?.signedUrl;
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentUrl
  };
}
