
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

  function onSubmit(values: FormValues) {
    console.log(values);
    console.log('Attached files:', files);
    
    // Mock successful submission with toast notification
    toast({
      title: "Bill created",
      description: `Bill ${values.billNumber} has been created with ${files.length} attachment(s)`,
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
        <BillFormFields control={form.control} />
        
        <FileUpload onFileChange={handleFileChange} />
        <FilePreview files={files} onRemoveFile={removeFile} />
        
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit" className="bg-construction-600 hover:bg-construction-700">Create Bill</Button>
        </div>
      </form>
    </Form>
  );
}
