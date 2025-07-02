import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpenProjectSelector } from "./OpenProjectSelector";

const formSchema = z.object({
  projectId: z.string().min(1, { message: "Project selection is required" }),
  propertyAddress: z.string().min(1, { message: "Property address is required" }),
  contractorName: z.string().min(1, { message: "Contractor name is required" }),
  releaseType: z.string().min(1, { message: "Release type is required" }),
  paymentAmount: z.string().min(1, { message: "Payment amount is required" }),
  paymentDate: z.date({ required_error: "Payment date is required" }),
  contractorMail: z.string().min(1, { message: "MailID is required" }),
  additionalNotes: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms to proceed",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export type LienReleaseFormRef = {
  submitForm: () => void;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  status: string;
};

export const LienReleaseForm = forwardRef<LienReleaseFormRef, Props>(
  ({ onSubmit, status }, ref) => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        projectId: "",
        propertyAddress: "",
        contractorName: "",
        releaseType: "",
        paymentAmount: "",
        additionalNotes: "",
        agreeToTerms: false,
        contractorMail: "",
      },
    });
    const formRef = useRef<HTMLFormElement>(null);

    useImperativeHandle(ref, () => ({
      submitForm: () => {
        form.handleSubmit(onSubmit)();
      },
    }));

    return (
      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <OpenProjectSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select or create a project"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="releaseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select release type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="conditional-waiver">Conditional Waiver and Release</SelectItem>
                      <SelectItem value="unconditional-waiver">Unconditional Waiver and Release</SelectItem>
                      <SelectItem value="partial-release">Partial Release of Lien</SelectItem>
                      <SelectItem value="final-release">Final Release of Lien</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="propertyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter property address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contractorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contractor/Supplier Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contractor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount ($)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractorMail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email id" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional notes or requirements..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-construction-50 p-4 rounded-lg border border-construction-100">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <FileText className="h-5 w-5 text-construction-700" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-construction-900">Attach Supporting Documents</h4>
                <p className="text-xs text-gray-600 mt-1">Optionally upload contracts, invoices, or other relevant documentation.</p>
                <Button type="button" variant="outline" size="sm" className="mt-3">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I certify that this information is true and correct
                  </FormLabel>
                  <FormDescription>
                    By checking this box, you confirm that you have the authority to execute this lien release.
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline">Cancel</Button>
            {/* <Button type="submit" className="bg-construction-600 hover:bg-construction-700">{status === "sending" ? "Sending..." : "Generate Lien Release"}</Button> */}
            <Button type="submit" className="bg-construction-600 hover:bg-construction-700">{status === "sending" ? "Sending..." : "Next"}</Button>
          </div>
        </form>
      </Form>
    );
  }
);
