
import { useState } from 'react';
import { 
  Download, 
  File, 
  FileText, 
  Image, 
  Trash2,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Video,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { type Document as DocType } from '@/hooks/useDocuments';

interface DocumentsListProps {
  documents: DocType[];
  loading: boolean;
  onDeleteDocument: (id: string, filePath: string) => Promise<{ success: boolean, error?: string }>;
  getDocumentUrl: (filePath: string) => Promise<string | null>;
}

export function DocumentsList({ 
  documents, 
  loading, 
  onDeleteDocument,
  getDocumentUrl 
}: DocumentsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDownload = async (doc: DocType) => {
    try {
      const url = await getDocumentUrl(doc.file_path);
      
      if (!url) {
        toast.error('Could not generate download link');
        return;
      }
      
      // Create temporary link and trigger download
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    setDeletingId(id);
    
    try {
      const result = await onDeleteDocument(id, filePath);
      
      if (result.success) {
        toast.success('Document deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('An error occurred while deleting the document');
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (fileType.startsWith('audio/')) return <Music className="h-6 w-6" />;
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) 
      return <FileSpreadsheet className="h-6 w-6" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) 
      return <FileArchive className="h-6 w-6" />;
    if (fileType.includes('html') || fileType.includes('json') || fileType.includes('xml')) 
      return <FileCode className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium">No documents yet</h3>
        <p className="text-muted-foreground mt-2">
          Upload your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="overflow-hidden">
          <CardHeader className="bg-muted/50 p-4 flex flex-row items-center space-x-4">
            {getFileIcon(doc.file_type)}
            <div className="flex-1 overflow-hidden">
              <h3 className="font-medium text-base truncate">{doc.name}</h3>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="p-4">
            {doc.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{doc.description}</p>
            )}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {doc.category && (
                <Badge variant="outline" className="text-xs">
                  {doc.category}
                </Badge>
              )}
              
              {doc.tags && doc.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0 flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 mr-2"
              onClick={() => handleDownload(doc)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex-none"
                  disabled={deletingId === doc.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{doc.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(doc.id, doc.file_path);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
