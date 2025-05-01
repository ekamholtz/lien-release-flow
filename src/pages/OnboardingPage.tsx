
import React from 'react';
import { useParams } from 'react-router-dom';
import { CompanySetup } from '@/components/onboarding/CompanySetup';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const OnboardingPage = () => {
  const { step } = useParams<{ step: string }>();
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-construction-50 to-gray-100">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto pt-12 pb-6">
          <AuthLogo />
        </div>
        
        {step === 'company' && <CompanySetup />}
        
        {/* Add more onboarding steps here as needed */}
      </div>
      <div className="mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            By using this service, you agree to our <a href="#" className="text-construction-600 hover:text-construction-700">Terms of Service</a> and <a href="#" className="text-construction-600 hover:text-construction-700">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
