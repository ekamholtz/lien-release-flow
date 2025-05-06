
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompanySetup } from '@/components/onboarding/CompanySetup';
import { PersonalInfoSetup } from '@/components/onboarding/PersonalInfoSetup';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { InvitationsCheck } from '@/components/onboarding/InvitationsCheck';
import { useCompany } from '@/contexts/CompanyContext';

const OnboardingPage = () => {
  const { step } = useParams<{ step: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { companies, isLoading: companiesLoading } = useCompany();
  
  useEffect(() => {
    // If the user has completed setup and has companies, redirect to dashboard
    if (user && !loading && !companiesLoading && companies.length > 0 && step === 'personal-info') {
      navigate('/dashboard');
    }
  }, [user, loading, companiesLoading, companies, step, navigate]);
  
  if (loading || companiesLoading) {
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
        
        {/* Check for pending invitations */}
        <InvitationsCheck />
        
        {/* Personal information step */}
        {step === 'personal-info' && <PersonalInfoSetup />}
        
        {/* Company setup step */}
        {step === 'company' && <CompanySetup />}
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
