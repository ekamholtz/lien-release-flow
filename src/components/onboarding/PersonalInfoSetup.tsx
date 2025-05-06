
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User } from 'lucide-react';
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
import { supabase } from "@/integrations/supabase/client";
import { invitationService } from '@/services/invitationService';
import { useAuth } from '@/hooks/useAuth';

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export function PersonalInfoSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasInvitations, setHasInvitations] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      jobTitle: "",
    },
  });

  // Pre-populate form with user metadata if available
  useEffect(() => {
    if (user?.user_metadata) {
      const { full_name, first_name, last_name, phone, job_title } = user.user_metadata;
      
      // If we have a full name but not first/last name, try to parse it
      if (full_name && (!first_name && !last_name)) {
        const nameParts = full_name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        form.setValue('firstName', firstName);
        form.setValue('lastName', lastName);
      } else {
        // Use specific first/last name if available
        if (first_name) form.setValue('firstName', first_name);
        if (last_name) form.setValue('lastName', last_name);
      }
      
      // Set other fields if available
      if (phone) form.setValue('phoneNumber', phone);
      if (job_title) form.setValue('jobTitle', job_title);
    }
  }, [user, form]);

  React.useEffect(() => {
    // Check if user has any pending invitations
    const checkInvitations = async () => {
      if (user?.email) {
        try {
          const invitations = await invitationService.checkPendingInvitations(user.email);
          setHasInvitations(invitations.length > 0);
        } catch (error) {
          console.error("Error checking invitations:", error);
          setHasInvitations(false);
        }
      }
    };
    
    if (user) {
      checkInvitations();
    }
  }, [user]);

  const onSubmit = async (values: PersonalInfoValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phoneNumber,
          job_title: values.jobTitle
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Personal info updated",
        description: "Your profile has been updated successfully.",
      });
      
      // If user has invitations, go to dashboard
      // Otherwise, go to company setup
      if (hasInvitations) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/company');
      }
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-construction-100 flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-construction-600" />
          </div>
          <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
          <CardDescription>
            Let's set up your personal profile before we continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Project Manager" {...field} />
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
                      Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
                <FormDescription className="text-center mt-2">
                  You can always update this information later from your profile settings.
                </FormDescription>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
