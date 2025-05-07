
import { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCompany } from '@/contexts/CompanyContext';
import { createClient, updateClient, Client } from '@/services/clientService';

const clientFormSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
  initialData?: Partial<Client>;
  isEditing?: boolean;
}

export function ClientForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  isEditing = false,
}: ClientFormProps) {
  const { currentCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
    },
  });

  async function onSubmit(values: ClientFormValues) {
    if (!currentCompany?.id) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      let client;
      
      if (isEditing && initialData?.id) {
        client = await updateClient(initialData.id, {
          ...values,
          company_id: currentCompany.id,
          // Ensure name is always passed since it's required
          name: values.name,
        });
      } else {
        client = await createClient({
          ...values,
          company_id: currentCompany.id,
          // Ensure name is always passed since it's required
          name: values.name,
        });
      }
      
      if (client) {
        onSuccess(client);
        form.reset();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" type="email" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Street address, city, state, zip" 
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
