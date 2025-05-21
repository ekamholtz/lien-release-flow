
import { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import { FilePreview } from "./FilePreview";
import { BillFormFields } from "./bill/BillFormFields";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BillStatus } from "@/lib/supabase";
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';

const lineItemSchema = z.object({
  categoryId: z.string().min(1, { message: "Category is required" }),
  description: z.string().optional(),
  amount: z.string().min(1, { message: "Amount is required" }),
  billable: z.boolean().default(false),
});

const formSchema = z.object({
  billNumber: z.string().min(1, { message: "Bill number is required" }),
  vendorId: z.string().min(1, { message: "Vendor is required" }),
  project: z.string().min(1, { message: "Project name is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  description: z.string().optional(),
  requiresLien: z.boolean().default(false),
  lineItems: z.array(lineItemSchema).min(1, { message: "At least one line item is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface BillFormProps {
  preselectedProjectId?: string | null;
}

export function BillForm({ preselectedProjectId }: BillFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorId: "",
      project: preselectedProjectId || "",
      amount: "",
      description: "",
      requiresLien: false,
      lineItems: [
        { categoryId: "", description: "", amount: "", billable: false }
      ]
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
      
      // Get vendor details
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('name, email')
        .eq('id', values.vendorId)
        .single();
        
      if (vendorError) {
        throw new Error(`Error fetching vendor: ${vendorError.message}`);
      }

      // Get the project manager ID (either from the project or the current user)
      let projectManagerId = user?.id;
      if (values.project) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('project_manager_id')
          .eq('id', values.project)
          .maybeSingle();

        if (!projectError && projectData && projectData.project_manager_id) {
          projectManagerId = projectData.project_manager_id;
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
      
      // Save bill to Supabase
      const { data, error } = await supabase
        .from('bills')
        .insert({
          bill_number: values.billNumber,
          vendor_id: values.vendorId,
          vendor_name: vendorData.name,
          vendor_email: vendorData.email || '',
          project_id: values.project || null,
          amount: amountNumber,
          due_date: formattedDueDate,
          status: 'pending' as BillStatus,
          company_id: companyId,
          requires_lien_release: values.requiresLien,
          project_manager_id: projectManagerId,
          has_line_items: true // Mark that this bill has line items
        })
        .select();
      
      if (error) {
        console.error('Error saving bill:', error);
        toast.error(`Failed to create bill: ${error.message}`);
        return;
      }
      
      // Save line items if bill was created successfully
      if (data && data[0] && data[0].id) {
        const billId = data[0].id;
        
        // Prepare line items for insertion
        const lineItemsToInsert = values.lineItems.map(item => ({
          bill_id: billId,
          category_id: item.categoryId,
          description: item.description || null,
          amount: parseFloat(item.amount),
          billable: item.billable
        }));
        
        // Insert line items
        const { error: lineItemsError } = await supabase
          .from('bill_line_items')
          .insert(lineItemsToInsert);
        
        if (lineItemsError) {
          console.error('Error saving line items:', lineItemsError);
          toast.error(`Bill created but failed to save line items: ${lineItemsError.message}`);
          // We continue anyway since the bill was created
        }
      }
      
      // Handle file uploads if there are any
      if (files.length > 0 && data?.[0]?.id) {
        // Upload logic here (can be expanded in the future)
        toast.info(`${files.length} files will be processed for upload.`);
      }
      
      toast.success(`Bill ${values.billNumber} has been created with ${files.length} attachment(s)`);
      
      // Reset form
      form.reset();
      setFiles([]);
      
      // Navigate to bills page with the correct route
      navigate('/bills');
    } catch (err) {
      console.error('Error in bill submission:', err);
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
        <BillFormFields control={form.control} />
        
        <FileUpload onFileSelect={handleFileSelect} />
        <FilePreview files={files} onRemoveFile={removeFile} />
        
        <div className="flex gap-3 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/bills')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-construction-600 hover:bg-construction-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Bill'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
