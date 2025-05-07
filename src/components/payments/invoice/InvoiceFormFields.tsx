
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { BasicInvoiceFields } from "./BasicInvoiceFields";
import { InvoiceClientField } from "./InvoiceClientField";
import { InvoiceProjectField } from "./InvoiceProjectField";
import { InvoiceDueDateField } from "./InvoiceDueDateField";
import { InvoiceDescriptionField } from "./InvoiceDescriptionField";

interface InvoiceFormFieldsProps {
  control: Control<any>;
}

export function InvoiceFormFields({ control }: InvoiceFormFieldsProps) {
  return (
    <>
      <BasicInvoiceFields control={control} />
      
      <InvoiceClientField control={control} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InvoiceProjectField control={control} />
        <InvoiceDueDateField control={control} />
      </div>
      
      <InvoiceDescriptionField control={control} />
    </>
  );
}
