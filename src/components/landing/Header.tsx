
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-construction-600 flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 font-bold text-xl text-construction-900">PaymentFlow</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-500 hover:text-construction-600">Features</a>
            <a href="#how-it-works" className="text-gray-500 hover:text-construction-600">How It Works</a>
            <a href="#roles" className="text-gray-500 hover:text-construction-600">For Teams</a>
            <a href="#testimonials" className="text-gray-500 hover:text-construction-600">Testimonials</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="text-construction-600 border-construction-200"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
            <Button 
              className="bg-construction-600 hover:bg-construction-700" 
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
