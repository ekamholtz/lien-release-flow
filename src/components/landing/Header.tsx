
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CNSTRCTLogo } from '@/components/ui/cnstrct-logo';

export function Header() {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <CNSTRCTLogo />
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-500 hover:text-cnstrct-orange">Features</a>
            <a href="#how-it-works" className="text-gray-500 hover:text-cnstrct-orange">How It Works</a>
            <a href="#roles" className="text-gray-500 hover:text-cnstrct-orange">For Teams</a>
            <a href="#testimonials" className="text-gray-500 hover:text-cnstrct-orange">Testimonials</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="text-cnstrct-navy border-gray-200"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
            <Button 
              className="bg-cnstrct-orange hover:bg-cnstrct-orange/90" 
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
