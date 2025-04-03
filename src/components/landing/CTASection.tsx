
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-construction-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Streamline Your Construction Payments?</h2>
        <p className="text-xl text-construction-100 mb-8 max-w-3xl mx-auto">
          Join contractors and service professionals who are simplifying their payment processes
        </p>
        <Button 
          size="lg" 
          className="bg-white text-construction-600 hover:bg-gray-100"
          onClick={() => navigate('/auth')}
        >
          Start Your Free Trial
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
