
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthLogo } from '@/components/auth/AuthLogo';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent } from "@/components/ui/card";

interface AuthFormProps {
  onSuccess?: (newUser: boolean) => void;
  invitedEmail?: string;
}

export function AuthForm({ onSuccess, invitedEmail }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<string>(invitedEmail ? "register" : "login");

  const handleSuccess = (newUser: boolean) => {
    if (onSuccess) onSuccess(newUser);
  };

  return (
    <Card className="border-none shadow-xl">
      <CardContent className="pt-6">
        <AuthLogo />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={() => handleSuccess(false)} defaultEmail={invitedEmail} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSuccess={() => handleSuccess(true)} defaultEmail={invitedEmail} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
