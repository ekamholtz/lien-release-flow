
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

  function onSubmit(values: FormValues) {
    console.log(values);
    console.log('Attached files:', files);
    
    // Show success message
    toast({
      title: "Invoice created",
      description: `Invoice ${values.invoiceNumber} has been created successfully with ${files.length} attachment(s)`,
    });
    
    // Here you would typically handle the form submission, e.g., send data to an API
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
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit" className="bg-construction-600 hover:bg-construction-700">Create Invoice</Button>
        </div>
      </form>
    </Form>
  );
}
