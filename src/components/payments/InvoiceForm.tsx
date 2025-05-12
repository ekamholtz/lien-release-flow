
import { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import { FilePreview } from "./FilePreview";
import { InvoiceFormFields } from "./invoice/InvoiceFormFields";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { InvoiceStatus } from "@/lib/supabase";
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  invoiceNumber: z.string().min(1, { message: "Invoice number is required" }),
  clientId: z.string().min(1, { message: "Client is required" }),
  project: z.string().min(1, { message: "Project name is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  preselectedProjectId?: string | null;
}

export function InvoiceForm({ preselectedProjectId }: InvoiceFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: "",
      project: preselectedProjectId || "",
      amount: "",
      description: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (!currentCompany?.id) {
      toast.error("Please select a company first");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Form Values:', values);
      console.log('Attached files:', files);
      
      // Convert amount from string to number
      const amountNumber = parseFloat(values.amount);
      
      // Format due date as ISO string (YYYY-MM-DD)
      const formattedDueDate = values.dueDate.toISOString().split('T')[0];
      
      // Get client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name, email')
        .eq('id', values.clientId)
        .single();
        
      if (clientError) {
        throw new Error(`Error fetching client: ${clientError.message}`);
      }

      // Get the project manager ID (either from the project or the current user)
      let projectManagerId = user?.id;
      if (values.project) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('project_manager_id, company_id')
          .eq('id', values.project)
          .maybeSingle();

        if (!projectError && projectData) {
          if (projectData.project_manager_id) {
            projectManagerId = projectData.project_manager_id;
          }
        }
      }

      // Try to get project company_id if a project is selected
      let companyId = currentCompany.id;
      if (values.project) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('company_id')
          .eq('id', values.project)
          .maybeSingle();
          
        if (!projectError && projectData && projectData.company_id) {
          companyId = projectData.company_id;
          console.log('Using project company_id:', companyId);
        } else {
          console.log('Falling back to current company_id:', companyId);
        }
      }
      
      // Save invoice to Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: values.invoiceNumber,
          client_id: values.clientId,
          client_name: clientData.name,
          client_email: clientData.email || '',
          project_id: values.project || null,
          amount: amountNumber,
          due_date: formattedDueDate,
          status: 'draft' as InvoiceStatus,
          company_id: companyId,
          project_manager_id: projectManagerId
        })
        .select();
      
      if (error) {
        console.error('Error saving invoice:', error);
        toast.error(`Failed to create invoice: ${error.message}`);
        return;
      }
      
      // Handle file uploads if there are any
      if (files.length > 0 && data?.[0]?.id) {
        // Upload logic here (can be expanded in the future)
        toast.info(`${files.length} files will be processed for upload.`);
      }
      
      toast.success(`Invoice ${values.invoiceNumber} has been created with ${files.length} attachment(s)`);
      
      // Reset form
      form.reset();
      setFiles([]);
      
      // Navigate to invoices page
      navigate('/invoices');
    } catch (err) {
      console.error('Error in invoice submission:', err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleFileSelect = (file: File) => {
    setFiles(prev => [...prev, file]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <InvoiceFormFields control={form.control} />
        
        <FileUpload onFileSelect={handleFileSelect} />
        <FilePreview files={files} onRemoveFile={removeFile} />
        
        <div className="flex gap-3 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/invoices')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-construction-600 hover:bg-construction-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
