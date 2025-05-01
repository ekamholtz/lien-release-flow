import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, FileText, Trash2, Grid, List } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  category?: string;
  tags?: string[];
  created_at: string;
}

interface DocumentsListProps {
  documents: Document[];
  loading: boolean;
  onDeleteDocument: (documentId: string) => void;
  getDocumentUrl: (filePath: string) => Promise<string | null>;
}

export function DocumentsList({ 
  documents, 
  loading, 
  onDeleteDocument, 
  getDocumentUrl 
}: DocumentsListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const bytesToSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };
  
  const handleViewDocument = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      if (url) {
        window.open(url, '_blank');
      } else {
        console.error('Failed to get document URL');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };
  
  const handleDownloadDocument = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      if (!url) {
        console.error('Failed to get document URL');
        return;
      }
      
      // Create a temporary anchor element
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };
  
  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (documentToDelete) {
      onDeleteDocument(documentToDelete);
      setDocumentToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-muted-foreground">Loading documents...</p>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium">No documents</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload documents to get started.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="inline-flex items-center rounded-md border border-input bg-transparent shadow-sm">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
            size="sm"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
            size="sm"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <div className="h-32 flex items-center justify-center bg-gray-100">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm truncate" title={doc.name}>
                    {doc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {bytesToSize(doc.file_size)}
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bytesToSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDocument(doc)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadDocument(doc)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteClick(doc.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
