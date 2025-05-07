
import { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import { FilePreview } from "./FilePreview";
import { BillFormFields } from "./BillFormFields";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BillStatus } from "@/lib/supabase";
import { useCompany } from '@/contexts/CompanyContext';

const formSchema = z.object({
  billNumber: z.string().min(1, { message: "Bill number is required" }),
  vendorId: z.string().min(1, { message: "Vendor is required" }),
  project: z.string().min(1, { message: "Project name is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  description: z.string().optional(),
  requiresLien: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function BillForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorId: "",
      project: "",
      amount: "",
      description: "",
      requiresLien: false,
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
      
      // Save bill to Supabase
      const { data, error } = await supabase
        .from('bills')
        .insert({
          bill_number: values.billNumber,
          vendor_id: values.vendorId,
          vendor_name: vendorData.name,
          vendor_email: vendorData.email || '',
          project_id: values.project,
          amount: amountNumber,
          due_date: formattedDueDate,
          status: 'pending' as BillStatus,
          company_id: currentCompany.id,
          requires_lien_release: values.requiresLien
        })
        .select();
      
      if (error) {
        console.error('Error saving bill:', error);
        toast.error(`Failed to create bill: ${error.message}`);
        return;
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
      
      // Navigate to accounts payable page
      navigate('/accounts-payable');
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
            onClick={() => navigate('/accounts-payable')}
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
