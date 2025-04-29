import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Grid, List, FileText, Image, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/payments/FileUpload';

interface DocumentsTabProps {
  projectId: string;
  isClientView?: boolean;
}

interface ProjectFile {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  shared_with_client: boolean;
  created_at: string;
  description?: string;
}

export function DocumentsTab({ projectId, isClientView = false }: DocumentsTabProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'images' | 'docs' | 'shared'>('all');
  
  useEffect(() => {
    fetchProjectFiles();
  }, [projectId]);
  
  const fetchProjectFiles = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);
        
      // If client view, only show shared files
      if (isClientView) {
        query = query.eq('shared_with_client', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setFiles(data || []);
      applyFilters(data || [], currentFilter, searchTerm);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load project documents');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    applyFilters(files, currentFilter, searchTerm);
  }, [searchTerm, currentFilter]);
  
  const applyFilters = (allFiles: ProjectFile[], filter: string, search: string) => {
    let result = [...allFiles];
    
    // Apply filter
    if (filter === 'images') {
      result = result.filter(file => file.file_type.startsWith('image/'));
    } else if (filter === 'docs') {
      result = result.filter(file => 
        file.file_type.includes('pdf') || 
        file.file_type.includes('doc') ||
        file.file_type.includes('text') ||
        file.file_type.includes('sheet')
      );
    } else if (filter === 'shared') {
      result = result.filter(file => file.shared_with_client);
    }
    
    // Apply search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(file => 
        file.name.toLowerCase().includes(lowerSearch) ||
        (file.description && file.description.toLowerCase().includes(lowerSearch))
      );
    }
    
    setFilteredFiles(result);
  };
  
  const handleToggleShared = async (file: ProjectFile) => {
    try {
      const { error } = await supabase
        .from('project_files')
        .update({ shared_with_client: !file.shared_with_client })
        .eq('id', file.id);
        
      if (error) throw error;
      
      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, shared_with_client: !f.shared_with_client } : f
      ));
      
      // Update filtered state
      setFilteredFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, shared_with_client: !f.shared_with_client } : f
      ));
      
      toast.success(`File ${file.shared_with_client ? 'no longer shared' : 'shared'} with client`);
    } catch (error) {
      console.error('Error updating file:', error);
      toast.error('Failed to update file sharing status');
    }
  };
  
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Create a unique file path to avoid conflicts
      const filePath = `${projectId}/${Date.now()}-${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get user id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Insert into project_files table
      const { error: fileError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          shared_with_client: false,
          user_id: user.id
        });
      
      if (fileError) throw fileError;
      
      toast.success('File uploaded successfully');
      fetchProjectFiles(); // Refresh file list
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async (file: ProjectFile) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(file.file_path);
      
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('doc')) return <FileText className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // Gallery view for files
  const renderGalleryView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.map(file => (
          <Card key={file.id} className="overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 flex-1 flex items-center justify-center">
              {file.file_type.startsWith('image/') ? (
                <div className="w-full h-32 relative">
                  {/* Public storage URL pattern */}
                  <img
                    src={`${supabase.storage.from('project-documents').getPublicUrl(file.file_path).data.publicUrl}`}
                    alt={file.name}
                    className="object-cover w-full h-full rounded"
                    onError={(e) => {
                      // Fix: Cast to HTMLImageElement to access style property
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.style.display = 'none';
                      if (imgElement.nextElementSibling) {
                        (imgElement.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="hidden absolute inset-0 items-center justify-center">
                    <FileText className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 flex items-center justify-center">
                  {getFileIcon(file.file_type)}
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium truncate">{file.name}</h3>
                {!isClientView && (
                  <div className="flex items-center">
                    <Switch
                      id={`share-${file.id}`}
                      checked={file.shared_with_client}
                      onCheckedChange={() => handleToggleShared(file)}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
                {!isClientView && (
                  <Label htmlFor={`share-${file.id}`} className="text-xs">
                    {file.shared_with_client ? 'Shared' : 'Not shared'}
                  </Label>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  // List view for files
  const renderListView = () => {
    return (
      <div className="space-y-2">
        {filteredFiles.map(file => (
          <Card key={file.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-50 rounded">
                  {getFileIcon(file.file_type)}
                </div>
                <div>
                  <h3 className="text-sm font-medium">{file.name}</h3>
                  <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {!isClientView && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`share-list-${file.id}`}
                      checked={file.shared_with_client}
                      onCheckedChange={() => handleToggleShared(file)}
                    />
                    <Label htmlFor={`share-list-${file.id}`} className="text-xs">
                      {file.shared_with_client ? 'Shared' : 'Not shared'}
                    </Label>
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                  Download
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {!isClientView && (
        <div>
          <FileUpload onFileSelect={handleFileUpload} />
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs 
            value={currentFilter} 
            onValueChange={(value) => setCurrentFilter(value as 'all' | 'images' | 'docs' | 'shared')}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('gallery')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading documents...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border rounded-md">
          <FileText className="h-12 w-12 text-gray-300 mb-2" />
          <h3 className="text-gray-700 font-medium">No documents found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'Upload documents to get started'}
          </p>
        </div>
      ) : (
        viewMode === 'gallery' ? renderGalleryView() : renderListView()
      )}
    </div>
  );
}
