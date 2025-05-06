
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { companySetupSchema } from '@/components/auth/validation';
import { useCompanies } from '@/hooks/useCompanies';
import { useCompany } from '@/contexts/CompanyContext';

type CompanySetupValues = z.infer<typeof companySetupSchema>;

export function CompanySetup() {
  const [isLoading, setIsLoading] = useState(false);
  const { createCompany } = useCompanies();
  const { switchCompany, refreshCompanies } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<CompanySetupValues>({
    resolver: zodResolver(companySetupSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phoneNumber: "",
      website: "",
    },
  });

  const onSubmit = async (values: CompanySetupValues) => {
    setIsLoading(true);
    
    try {
      // First create the company with basic info
      const company = await createCompany.mutateAsync(values.name);
      
      if (!company || !company.id) {
        throw new Error("Failed to create company");
      }
      
      console.log("Company created successfully:", company);
      
      // Refresh the companies list to ensure the new company is loaded
      await refreshCompanies();
      
      // Short delay to ensure company data is available
      setTimeout(async () => {
        try {
          // Then switch to the new company context
          await switchCompany(company.id);
          
          // Show success message
          toast({
            title: "Company setup complete",
            description: "Your company has been created successfully. You can now use the platform.",
          });
          
          // Redirect to dashboard
          navigate('/dashboard');
        } catch (switchError: any) {
          console.error('Error switching to company:', switchError);
          toast({
            title: "Couldn't set company context",
            description: "Your company was created but we had trouble setting it as your active company. Please try again from the dashboard.",
            variant: "destructive",
          });
          navigate('/dashboard');
        }
      }, 500);
    } catch (error: any) {
      console.error('Company setup error:', error);
      toast({
        title: "Company setup failed",
        description: error.message || "There was an error setting up your company",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-construction-100 flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-construction-600" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Company</CardTitle>
          <CardDescription>
            Provide details about your company to get started with PaymentFlow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company LLC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="94103" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(415) 555-0123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up company...
                    </>
                  ) : (
                    "Complete Company Setup"
                  )}
                </Button>
                <FormDescription className="text-center mt-2">
                  You can always update these details later from the settings page.
                </FormDescription>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
