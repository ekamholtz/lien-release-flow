
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';
import { DocumentsList } from '@/components/documents/DocumentsList';

interface ProjectDocumentsProps {
  project: DbProject;
}

export function ProjectDocuments({ project }: ProjectDocumentsProps) {
  const { data: documents = [] } = useQuery({
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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Documents</h2>
      <DocumentsList documents={documents} />
    </div>
  );
}
