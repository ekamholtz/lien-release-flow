
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function getDocumentUrl(filePath: string, expirySeconds = 60) {
  try {
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

export async function downloadDocument(filePath: string, fileName: string) {
  try {
    const url = await getDocumentUrl(filePath);
    
    if (!url) {
      throw new Error('Failed to get document URL');
    }
    
    // Create and trigger a download link
    const a = window.document.createElement('a');
    a.href = url;
    a.download = fileName;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    
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
