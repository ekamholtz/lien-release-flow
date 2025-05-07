
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Make sure the 'project-documents' bucket exists
async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === 'project-documents')) {
    try {
      await supabase.storage.createBucket('project-documents', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    } catch (error) {
      // Bucket might have been created in another call
      console.log('Bucket creation error (might already exist):', error);
    }
  }
}

export async function getDocumentUrl(filePath: string, expirySeconds = 60) {
  try {
    await ensureBucketExists();
    
    const { data, error } = await supabase.storage
      .from('project-documents')
      .createSignedUrl(filePath, expirySeconds);
      
    if (error) throw error;
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting document URL:', error);
    toast.error('Failed to retrieve document URL');
    return null;
  }
}

export async function uploadDocument(file: File, path: string) {
  try {
    await ensureBucketExists();
    
    const { data, error } = await supabase.storage
      .from('project-documents')
      .upload(path, file);
      
    if (error) throw error;
    
    return data.path;
  } catch (error) {
    console.error('Error uploading document:', error);
    toast.error('Failed to upload document');
    return null;
  }
}

export async function downloadDocument(filePath: string, fileName: string) {
  try {
    const url = await getDocumentUrl(filePath);
    
    if (!url) {
      throw new Error('Failed to get document URL');
    }
    
    // Create and trigger a download link
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('Error downloading document:', error);
    toast.error('Failed to download document');
    return false;
  }
}

export async function deleteProjectDocument(id: string, filePath: string) {
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
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    toast.error('Failed to delete document');
    return false;
  }
}
