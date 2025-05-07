
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function createDraftProject(values: {
  name: string,
  clientId: string,
  value: number,
  projectTypeId: string,
  companyId: string,
  clientName: string
}) {
  try {
    // Create draft project with minimal info
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: values.name,
        client_id: values.clientId,
        client: values.clientName, // Include the client name for the legacy field
        value: values.value,
        project_type_id: values.projectTypeId,
        start_date: new Date().toISOString().split('T')[0],
        status: "draft",
        company_id: values.companyId
      })
      .select()
      .single();

    if (error) throw error;
    
    return project;
  } catch (error: any) {
    console.error("Error creating project:", error);
    toast.error(`Failed to create project: ${error.message}`);
    throw error;
  }
}

export async function getClientName(clientId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .single();
      
    if (error) {
      throw new Error(`Failed to fetch client details: ${error.message}`);
    }

    return data.name;
  } catch (error: any) {
    console.error("Error fetching client name:", error);
    throw error;
  }
}
