
import React from 'react';
import { TestimonialCard } from '@/components/landing/TestimonialCard';

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">What Our Clients Say</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from contractors and subcontractors who have streamlined their payment processes
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TestimonialCard 
            quote="PaymentFlow has cut our payment processing time in half. The electronic lien release feature alone has saved us countless hours of paperwork."
            author="Michael Johnson"
            role="CFO"
            company="Johnson Construction"
            className="animate-fade-in"
          />
          <TestimonialCard 
            quote="As a subcontractor, getting paid quickly is crucial. With PaymentFlow, we've reduced our payment wait times by over 60%."
            author="Sarah Williams"
            role="Owner"
            company="Williams Electric"
            className="animate-fade-in [animation-delay:100ms]"
          />
          <TestimonialCard 
            quote="The QuickBooks integration is seamless. Now all our financial data syncs automatically, and we don't have to manually reconcile anymore."
            author="Robert Chen"
            role="Controller"
            company="Chen & Associates"
            className="animate-fade-in [animation-delay:200ms]"
          />
        </div>
      </div>
    </section>
  );
}
