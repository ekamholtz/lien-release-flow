
import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { FileUpload } from "./FileUpload";
import { FilePreview } from "./FilePreview";
import { BillFormFields } from "./BillFormFields";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BillStatus } from "@/lib/supabase";

const formSchema = z.object({
  billNumber: z.string().min(1, { message: "Bill number is required" }),
  vendorName: z.string().min(1, { message: "Vendor name is required" }),
  vendorEmail: z.string().email({ message: "Invalid email address" }),
  vendorPhone: z.string().min(10, { message: "Valid phone number is required" }).optional(),
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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName: "",
      vendorEmail: "",
      vendorPhone: "",
      project: "",
      amount: "",
      description: "",
      requiresLien: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('Form Values:', values);
      console.log('Attached files:', files);
      
      // Convert amount from string to number
      const amountNumber = parseFloat(values.amount);
      
      // Format due date as ISO string (YYYY-MM-DD)
      const formattedDueDate = values.dueDate.toISOString().split('T')[0];
      
      // Save bill to Supabase
      const { data, error } = await supabase
        .from('bills')
        .insert({
          bill_number: values.billNumber,
          vendor_name: values.vendorName,
          vendor_email: values.vendorEmail,
          project_id: values.project, // Assuming project is the UUID
          amount: amountNumber,
          due_date: formattedDueDate,
          status: 'pending' as BillStatus
        })
        .select();
      
      if (error) {
        console.error('Error saving bill:', error);
        toast({
          title: "Error",
          description: `Failed to create bill: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Bill created",
        description: `Bill ${values.billNumber} has been created with ${files.length} attachment(s)`,
      });
      
      // Reset form
      form.reset();
      setFiles([]);
      
      // Navigate to accounts payable page
      navigate('/accounts-payable');
    } catch (err) {
      console.error('Error in bill submission:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BillFormFields control={form.control} />
        
        <FileUpload onFileChange={handleFileChange} />
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
