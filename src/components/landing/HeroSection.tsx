
import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RetroGrid } from '@/components/ui/retro-grid';
import { useAuth } from '@/hooks/useAuth';

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  
  const handleViewDemo = () => {
    navigate('/contact?demo=true');
  };
  
  return (
    <section className="bg-gradient-to-br from-cnstrct-navy/5 to-gray-100 py-20 relative overflow-hidden">
      <RetroGrid className="opacity-30" angle={55} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-cnstrct-navy leading-tight">
              Streamline Your Construction Payments
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Simplify your accounts payable and receivable processes with integrated payment solutions and automated lien releases.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg"
                className="bg-cnstrct-orange hover:bg-cnstrct-orange/90" 
                onClick={handleGetStarted}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="text-cnstrct-navy border-gray-200"
                onClick={handleViewDemo}
              >
                View Demo
              </Button>
            </div>
            <div className="mt-6 flex items-center text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>No credit card required to start</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 transform hover:scale-[1.02] transition-all animate-fade-in">
            <img 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Construction Payment Dashboard" 
              className="rounded-md w-full shadow-sm"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
