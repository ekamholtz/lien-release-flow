
import { useState, useEffect } from 'react';
import { UploadDocumentDialog } from './UploadDocumentDialog';
import { DocumentsList } from './DocumentsList';
import { useDocuments } from '@/hooks/useDocuments';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function DocumentsTab() {
  const { 
    documents, 
    loading, 
    error, 
    fetchDocuments, 
    deleteDocument,
    getDocumentUrl 
  } = useDocuments();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState(documents);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(lowerSearchTerm) ||
      (doc.description && doc.description.toLowerCase().includes(lowerSearchTerm)) ||
      (doc.category && doc.category.toLowerCase().includes(lowerSearchTerm)) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
    
    setFilteredDocuments(filtered);
  }, [searchTerm, documents]);

  const handleDocumentUploaded = () => {
    fetchDocuments();
  };

  // Create an adapter function to match the expected DocumentsList signature
  const handleDeleteDocument = (documentId: string) => {
    // We need to get the file path for the document before deleting it
    const document = documents.find(doc => doc.id === documentId);
    if (document) {
      deleteDocument(documentId, document.file_path);
    } else {
      console.error('Document not found:', documentId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <UploadDocumentDialog onDocumentUploaded={handleDocumentUploaded} />
      </div>
      
      {error ? (
        <div className="bg-red-50 border-red-200 text-red-600 p-6 rounded-md">
          <p>Error loading documents. Please try again later.</p>
        </div>
      ) : (
        <DocumentsList
          documents={filteredDocuments}
          loading={loading}
          onDeleteDocument={handleDeleteDocument}
          getDocumentUrl={getDocumentUrl}
        />
      )}
    </div>
  );
}
