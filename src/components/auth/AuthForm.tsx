
import React, { useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthLogo } from '@/components/auth/AuthLogo';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function AuthForm() {
  // Create a ref to programmatically click the login tab
  const loginTabRef = useRef<HTMLButtonElement>(null);

  // Function to switch to login tab after successful registration
  const handleRegisterSuccess = () => {
    if (loginTabRef.current) {
      loginTabRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthLogo />
      
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login" data-value="login" ref={loginTabRef}>Sign In</TabsTrigger>
          <TabsTrigger value="register" data-value="register">Create Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        
        <TabsContent value="register">
          <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
