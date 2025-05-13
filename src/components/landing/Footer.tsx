
import React from 'react';
import { CNSTRCTLogo } from '@/components/ui/cnstrct-logo';

export function Footer() {
  return (
    <footer className="bg-cnstrct-navy text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <CNSTRCTLogo size="sm" />
            </div>
            <p className="text-sm">
              Streamlining construction payments with integrated solutions for lien releases and accounting.
            </p>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-medium mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-cnstrct-orange">Features</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Pricing</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Integrations</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Case Studies</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-medium mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cnstrct-orange">Documentation</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Blog</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Webinars</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cnstrct-orange">About Us</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Careers</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Contact</a></li>
              <li><a href="#" className="hover:text-cnstrct-orange">Legal</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">© 2023 CNSTRCT. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-cnstrct-orange">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-cnstrct-orange">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-cnstrct-orange">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
