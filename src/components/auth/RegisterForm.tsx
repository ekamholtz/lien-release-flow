
import React, { useState, useEffect } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { registerSchema, invitationRegisterSchema } from '@/components/auth/validation';
import { invitationService, InvitationDetails } from '@/services/invitationService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

type RegisterFormValues = z.infer<typeof registerSchema>;
type InvitationRegisterFormValues = z.infer<typeof invitationRegisterSchema>;

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get('invitation');
  const invitationEmail = searchParams.get('email');
  
  const formSchema = invitation ? invitationRegisterSchema : registerSchema;
  
  const form = useForm<RegisterFormValues | InvitationRegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: invitationEmail || "",
      password: "",
    },
  });

  useEffect(() => {
    // Check for invitation details if we have an invitation ID
    const checkInvitation = async () => {
      if (invitationId && invitationEmail) {
        try {
          const invitations = await invitationService.checkPendingInvitations(invitationEmail);
          const matchedInvitation = invitations.find(inv => inv.id === invitationId);
          
          if (matchedInvitation) {
            setInvitation(matchedInvitation);
            // Pre-fill the email
            form.setValue('email', invitationEmail);
          }
        } catch (err) {
          console.error("Error checking invitation:", err);
        }
      }
    };
    
    checkInvitation();
  }, [invitationId, invitationEmail]);

  async function onSubmit(values: RegisterFormValues | InvitationRegisterFormValues) {
    setIsLoading(true);
    
    try {
      // Parse the full name into first and last name
      const nameParts = values.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Base user data
      const userData = {
        full_name: values.fullName,
        first_name: firstName,
        last_name: lastName
      };
      
      // Register the user with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: userData,
        },
      });

      if (authError) {
        throw authError;
      }

      // Check if email confirmation is required
      if (authData?.user) {
        if (invitation && authData.session) {
          // Accept the invitation automatically
          try {
            await invitationService.acceptInvitation(invitation.id, authData.user.id);
            toast({
              title: "Account created successfully",
              description: `You have joined ${invitation.company_name}. Welcome!`,
            });
            
            // Redirect to dashboard
            navigate('/dashboard');
          } catch (err) {
            console.error("Error accepting invitation:", err);
            toast({
              title: "Account created, but couldn't join company",
              description: "Please contact the company administrator.",
              variant: "destructive",
            });
            
            // Still notify parent of successful registration
            onRegisterSuccess();
          }
        } else if (authData.session) {
          // Self-registration - User is immediately signed in (email confirmation disabled)
          toast({
            title: "Account created successfully",
            description: "Welcome to PaymentFlow! Please complete your profile.",
          });
          
          // Redirect to personal info setup page first
          navigate('/onboarding/personal-info');
        } else {
          // Email confirmation is required
          toast({
            title: "Account created successfully",
            description: "Please check your email to confirm your account.",
          });
          
          // Notify parent component of successful registration
          onRegisterSuccess();
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Create your account</h3>
      
      {invitation && (
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>You've been invited!</AlertTitle>
          <AlertDescription>
            You've been invited to join {invitation.company_name} as {invitation.role.replace('_', ' ')}.
          </AlertDescription>
        </Alert>
      )}
      
      {!invitation && (
        <p className="text-sm text-gray-500 mb-6">Enter your details to get started</p>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                  <Input 
                    placeholder="email@example.com" 
                    {...field} 
                    disabled={!!invitation}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Create a strong password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-construction-600 hover:bg-construction-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
