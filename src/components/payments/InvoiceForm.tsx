
import React from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { InvoiceFormFields } from "./InvoiceFormFields";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { InvoiceOptions } from "./InvoiceOptions";

const formSchema = z.object({
  invoiceNumber: z.string().min(1, { message: "Invoice number is required" }),
  clientName: z.string().min(1, { message: "Client name is required" }),
  clientEmail: z.string().email({ message: "Invalid email address" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  description: z.string().optional(),
  paymentMethod: z.enum(["regular", "accelerated"]).default("regular"),
  sendLienRelease: z.boolean().default(false),
  includePaymentLink: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function InvoiceForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "",
      clientEmail: "",
      amount: "",
      description: "",
      paymentMethod: "regular",
      sendLienRelease: false,
      includePaymentLink: true,
    },
  });

  function onSubmit(values: FormValues) {
    console.log(values);
    
    // Show success message
    toast({
      title: "Invoice created",
      description: `Invoice ${values.invoiceNumber} has been created successfully`,
    });
    
    // Here you would typically handle the form submission, e.g., send data to an API
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <InvoiceFormFields control={form.control} />
        
        <PaymentMethodSelector control={form.control} />
        
        <InvoiceOptions control={form.control} />
        
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit" className="bg-construction-600 hover:bg-construction-700">Create Invoice</Button>
        </div>
      </form>
    </Form>
  );
}
