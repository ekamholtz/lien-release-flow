
import React from 'react';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform simplifies the entire payment flow for construction projects
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative">
            <div className="absolute -top-4 -left-4 h-8 w-8 rounded-full bg-construction-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold mb-3 mt-2">Set Up Your Account</h3>
            <p className="text-gray-500">
              Connect your payment services and accounting software to create a unified financial hub.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative">
            <div className="absolute -top-4 -left-4 h-8 w-8 rounded-full bg-construction-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold mb-3 mt-2">Create & Send Invoices</h3>
            <p className="text-gray-500">
              Generate professional invoices and payment requests with customizable lien release requirements.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative">
            <div className="absolute -top-4 -left-4 h-8 w-8 rounded-full bg-construction-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold mb-3 mt-2">Collect & Make Payments</h3>
            <p className="text-gray-500">
              Process payments with integrated e-signature collection for lien releases, ensuring legal compliance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
