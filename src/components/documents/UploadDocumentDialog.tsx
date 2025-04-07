
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface UploadDocumentDialogProps {
  onDocumentUploaded: () => void;
}

interface FormValues {
  name: string;
  description?: string;
  category?: string;
  tags?: string;
}

export function UploadDocumentDialog({ onDocumentUploaded }: UploadDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  
  const onSubmit = async (data: FormValues) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Import dynamically to avoid issues
      const { useDocuments } = await import('@/hooks/useDocuments');
      const { uploadDocument } = useDocuments();
      
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()) : undefined;
      
      const result = await uploadDocument(
        selectedFile,
        data.name,
        data.description,
        data.category,
        tags
      );
      
      if (result.success) {
        toast.success('Document uploaded successfully');
        handleCloseDialog();
        onDocumentUploaded();
      } else {
        toast.error(result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('An error occurred while uploading the document');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };
  
  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedFile(null);
    reset();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cnstrct-orange hover:bg-cnstrct-orange/90">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
              {!selectedFile ? (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <Input 
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Label htmlFor="file" className="mt-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer">
                    Select File
                  </Label>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm truncate max-w-[300px]">{selectedFile.name}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Document name is required" })}
              placeholder="Enter document name"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter document description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="E.g. Invoice, Contract, Receipt"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional, comma separated)</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="E.g. important, 2024, project-x"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
