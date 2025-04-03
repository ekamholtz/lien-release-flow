
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

const Auth = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-construction-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <AuthForm />
        <p className="text-center text-sm text-gray-500 mt-6">
          By using this service, you agree to our <a href="#" className="text-construction-600 hover:text-construction-700">Terms of Service</a> and <a href="#" className="text-construction-600 hover:text-construction-700">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Auth;
