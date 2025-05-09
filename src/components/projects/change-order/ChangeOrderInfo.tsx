
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

// Define the schema for change order information
const changeOrderSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number()
    .refine(val => !isNaN(val), {
      message: 'Amount must be a valid number',
    }),
});

type ChangeOrderInfoValues = z.infer<typeof changeOrderSchema>;

interface ChangeOrderInfoProps {
  initialData: any;
  projectValue: number;
  updateFormData: (data: any) => void;
}

const ChangeOrderInfo = ({ initialData, projectValue, updateFormData }: ChangeOrderInfoProps) => {
  const [newProjectValue, setNewProjectValue] = useState<number>(projectValue);
  
  const form = useForm<ChangeOrderInfoValues>({
    resolver: zodResolver(changeOrderSchema),
    defaultValues: {
      description: initialData?.description || '',
      amount: initialData?.amount || 0,
    },
  });

  // Update the form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description || '',
        amount: initialData.amount || 0,
      });
    }
  }, [initialData, form]);

  // Update the new project value when amount changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const amount = parseFloat(value.amount?.toString() || '0');
      setNewProjectValue(projectValue + amount);
    });
    
    return () => subscription.unsubscribe();
  }, [form, projectValue]);

  const onSubmit = (data: ChangeOrderInfoValues) => {
    updateFormData({
      description: data.description,
      amount: data.amount,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Change Order Information</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Project Value</CardTitle>
          <CardDescription>The current contract value for this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(projectValue)}</div>
        </CardContent>
      </Card>
      
      <Form {...form}>
        <form onChange={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Change Order Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the reason for this change order"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-7"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      <Card>
        <CardHeader>
          <CardTitle>New Project Value</CardTitle>
          <CardDescription>The new contract value after this change order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(newProjectValue)}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {form.watch('amount') > 0 
              ? `Increase of ${formatCurrency(form.watch('amount'))}`
              : form.watch('amount') < 0 
                ? `Decrease of ${formatCurrency(Math.abs(form.watch('amount')))}`
                : 'No change in contract value'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeOrderInfo;
