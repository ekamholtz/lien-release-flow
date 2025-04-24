import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { InvoiceFormFields } from "./InvoiceFormFields";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { InvoiceOptions } from "./InvoiceOptions";
import { FileUpload } from "./FileUpload";
import { FilePreview } from "./FilePreview";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { InvoiceStatus } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  invoiceNumber: z.string().min(1, { message: "Invoice number is required" }),
  clientName: z.string().min(1, { message: "Client name is required" }),
  clientEmail: z.string().email({ message: "Invalid email address" }),
  clientPhone: z.string().min(10, { message: "Valid phone number is required" }).optional(),
  project: z.string().min(1, { message: "Project name is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  description: z.string().optional(),
  paymentMethod: z.enum(["regular", "accelerated"]).default("regular"),
  sendLienRelease: z.boolean().default(false),
  includePaymentLink: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function InvoiceForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      project: "",
      amount: "",
      description: "",
      paymentMethod: "regular",
      sendLienRelease: false,
      includePaymentLink: true,
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create invoices",
        variant: "destructive"
      });
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
      
      // Save invoice to Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: values.invoiceNumber,
          client_name: values.clientName,
          client_email: values.clientEmail,
          project_id: values.project,
          amount: amountNumber,
          due_date: formattedDueDate,
          status: 'draft' as InvoiceStatus,
          payment_method: values.paymentMethod,
          user_id: user.id
        })
        .select();
      
      if (error) {
        console.error('Error saving invoice:', error);
        toast({
          title: "Error",
          description: `Failed to create invoice: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Invoice created",
        description: `Invoice ${values.invoiceNumber} has been created successfully with ${files.length} attachment(s)`,
      });
      
      // Reset form
      form.reset();
      setFiles([]);
      
      // Navigate to accounts receivable page
      navigate('/accounts-receivable');
    } catch (err) {
      console.error('Error in invoice submission:', err);
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
        <InvoiceFormFields control={form.control} />
        
        <PaymentMethodSelector control={form.control} />
        
        <InvoiceOptions control={form.control} />
        
        <FileUpload onFileChange={handleFileChange} />
        <FilePreview files={files} onRemoveFile={removeFile} />
        
        <div className="flex gap-3 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/accounts-receivable')}
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
