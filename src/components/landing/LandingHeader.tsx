import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CNSTRCTLogo } from '@/components/ui/cnstrct-logo';

export function LandingHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <CNSTRCTLogo size="sm" />
              <span className="ml-2 text-lg font-medium">CNSTRCT</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/#features" className="text-gray-600 hover:text-cnstrct-orange">Features</Link>
            <Link to="/#pricing" className="text-gray-600 hover:text-cnstrct-orange">Pricing</Link>
            <Link to="/contact" className="text-gray-600 hover:text-cnstrct-orange">Contact</Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link to="/auth" className="hidden md:block">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link to="/auth?signup=true">
              <Button className="bg-cnstrct-orange hover:bg-cnstrct-orange/90">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
