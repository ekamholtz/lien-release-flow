
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
      }, HTMLElement>;
    }
  }
}

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Handle redirects if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Load Stripe pricing table script
  useEffect(() => {
    if (!scriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);
      scriptRef.current = script;
    }

    // Handle success redirect from URL parameters
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      navigate('/dashboard');
    }

    return () => {
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
      }
    };
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-construction-50 to-gray-100">
      <div className="py-6 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-bold text-construction-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-600 mb-8">
          Select the plan that best fits your business needs
        </p>
        
        <div className="max-w-4xl mx-auto">
          <stripe-pricing-table 
            pricing-table-id="prctbl_1RAHu4Apu80f9E3HscOHoVSP"
            publishable-key="pk_test_51QzjhnApu80f9E3HjlgkmHwM1a4krzjoz0sJlsz41wIhMYIr1sst6sx2mCZ037PiY2UE6xfNA5zzkxCQwOAJ4yoD00gm7TIByL"
          />
        </div>
      </div>
    </div>
  );
};

export default Subscription;
