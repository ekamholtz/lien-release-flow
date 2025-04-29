
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  
  const getDocumentUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(filePath, 60); // 1 minute expiry
        
      if (error) throw error;
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      toast.error('Failed to retrieve document URL');
      throw error;
    }
  };
  
  const handleDownload = async (document: ProjectDocument) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };
  
  const handleDeleteDocument = async (id: string, filePath: string) => {
    try {
      // First delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([filePath]);
        
      if (storageError) throw storageError;
      
      // Then delete the database record
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', id);
        
      if (dbError) throw dbError;
      
      toast.success('Document deleted successfully');
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p>Loading project documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
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
      
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-400 my-2" />
            <h3 className="text-lg font-medium">No documents</h3>
            <p className="text-gray-500 mt-1">
              {documents.length > 0 
                ? "No documents match your search." 
                : "Upload project documents to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="h-24 flex items-center justify-center bg-gray-100 rounded mb-3">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="font-medium truncate">{document.name}</h3>
                  {document.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{document.description}</p>
                  )}
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    {new Date(document.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(document)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
