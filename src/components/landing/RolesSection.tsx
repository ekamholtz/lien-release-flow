
import React from 'react';
import { Building, Briefcase, Home, CheckCircle } from 'lucide-react';

export function RolesSection() {
  return (
    <section id="roles" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">For Every Team Member</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Tailored solutions for all roles in the construction payment process
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-full bg-construction-100 flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-construction-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">General Contractors</h3>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Manage payments to multiple subcontractors</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Collect required lien releases automatically</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Sync with your accounting software</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-full bg-construction-100 flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-construction-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Subcontractors</h3>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Create professional invoices in seconds</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Streamline electronic signature process</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Get paid faster with integrated payments</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-full bg-construction-100 flex items-center justify-center mb-4">
              <Home className="h-6 w-6 text-construction-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Property Owners</h3>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Pay contractors securely through the platform</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Ensure proper lien documentation is collected</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <span>Track project payments in one place</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
