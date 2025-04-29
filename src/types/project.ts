
export interface ProjectType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface MilestoneTemplate {
  id: string;
  name: string;
  description?: string;
  project_type_id?: string;
  template_data: {
    is_recurring: boolean;
    milestones: {
      name: string;
      percentage?: number;
      amount?: number;
    }[];
  };
}

export interface ProjectFile {
  id: string;
  name: string;
  description?: string;
  file_path: string;
  file_size: number;
  file_type: string;
  shared_with_client: boolean;
  user_id: string;
  created_at: string;
}
