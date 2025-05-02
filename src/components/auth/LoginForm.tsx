
import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema } from '@/components/auth/validation';

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast: shadcnToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      console.log("Attempting login with:", values.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error('Login error:', error);
        setLoginError(error.message || "Invalid login credentials. Please check your email and password.");
        toast.error("Login failed", {
          description: error.message || "Invalid login credentials"
        });
        shadcnToast({
          title: "Login failed",
          description: error.message || "There was a problem with your login credentials",
          variant: "destructive",
        });
        return;
      }

      // Show both toast notifications to ensure at least one works
      toast.success("Logged in successfully", {
        description: "Welcome back to PaymentFlow!"
      });
      
      shadcnToast({
        title: "Logged in successfully",
        description: "Welcome back to PaymentFlow!",
      });
      
      console.log("Login successful, user:", data.user);
      
      // After successful login, check if the user has an active subscription
      const user = data.user;
      if (user) {
        try {
          console.log("Checking subscription for user:", user.id);
          const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('get-subscription', {
            body: { userId: user.id }
          });
          
          if (subscriptionError) {
            console.error('Error checking subscription:', subscriptionError);
          }
          
          console.log("Subscription data:", subscriptionData);
          
          // If user has an active subscription, redirect to dashboard
          // Otherwise, redirect to subscription page
          if (subscriptionData?.data && 
              (subscriptionData.data.status === 'active' || subscriptionData.data.status === 'trialing')) {
            // Always navigate to dashboard for users with active subscriptions
            console.log("User has active subscription, redirecting to dashboard");
            navigate('/dashboard');
          } else {
            // Check if there's a redirect stored in location state
            const from = (location.state as any)?.from?.pathname;
            
            // If they were trying to access a protected route, send them to that route
            // Otherwise send them to subscription page
            if (from && from !== '/auth' && from !== '/') {
              console.log("Redirecting to previously attempted route:", from);
              navigate(from);
            } else {
              console.log("No active subscription, redirecting to subscription page");
              navigate('/subscription');
            }
          }
        } catch (subError) {
          console.error('Error in subscription check:', subError);
          navigate('/subscription'); // Default to subscription page if check fails
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || "There was a problem logging in. Please try again.");
      toast.error("Login failed", {
        description: error.message || "An unexpected error occurred"
      });
      shadcnToast({
        title: "Login failed",
        description: error.message || "There was a problem with your login credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Log in to your account</h3>
      <p className="text-sm text-gray-500 mb-6">Enter your email and password to access your account</p>
      
      {loginError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" autoComplete="email" {...field} />
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
                  <Input type="password" placeholder="Enter your password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-construction-600 hover:bg-construction-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
          
          <div className="text-center">
            <Button variant="link" className="text-sm text-construction-600" type="button" onClick={() => alert("Password reset functionality would be implemented here")}>
              Forgot your password?
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
