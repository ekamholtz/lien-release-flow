
import { Control } from "react-hook-form";
import { BasicBillFields } from "./BasicBillFields";
import { BillVendorField } from "./BillVendorField";
import { BillProjectField } from "./BillProjectField";
import { BillDueDateField } from "./BillDueDateField";
import { BillDescriptionField } from "./BillDescriptionField";
import { BillLienRequirementField } from "./BillLienRequirementField";
import { BillLineItems } from "./BillLineItems";

interface BillFormFieldsProps {
  control: Control<any>;
}

export function BillFormFields({ control }: BillFormFieldsProps) {
  return (
    <>
      <BasicBillFields control={control} />
      
      <BillVendorField control={control} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BillProjectField control={control} />
        <BillDueDateField control={control} />
      </div>
      
      <BillDescriptionField control={control} />
      
      <BillLienRequirementField control={control} />
      
      <BillLineItems control={control} />
    </>
  );
}
