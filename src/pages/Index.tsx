
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { RolesSection } from '@/components/landing/RolesSection';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection onGetStarted={handleGetStarted} />
        
        {/* Features */}
        <FeaturesSection />
        
        {/* How it Works */}
        <HowItWorksSection />
        
        {/* Roles */}
        <RolesSection />
        
        {/* Comparison Table */}
        <ComparisonTable />
        
        {/* Testimonials */}
        <TestimonialsSection />
        
        {/* CTA */}
        <CTASection onGetStarted={handleGetStarted} />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
