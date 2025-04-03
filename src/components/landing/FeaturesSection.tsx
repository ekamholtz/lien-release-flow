
import React from 'react';
import { CircleDollarSign, FileSignature, FileText } from 'lucide-react';
import { ComparisonTable } from '@/components/landing/ComparisonTable';

interface FeatureCardProps { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="h-12 w-12 rounded-full bg-construction-100 flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-construction-600" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-500 text-sm">{description}</p>
  </div>
);

// Sample data for comparison table
const comparisonFeatures = [
  { name: "Integrated Payment Processing", paymentFlow: true, others: false },
  { name: "Electronic Lien Releases", paymentFlow: true, others: false },
  { name: "QuickBooks Online Integration", paymentFlow: true, others: true },
  { name: "Customizable Approval Workflows", paymentFlow: true, others: false },
  { name: "Automated Payment Reminders", paymentFlow: true, others: true },
  { name: "Mobile Responsive Interface", paymentFlow: true, others: true },
  { name: "AI-Powered Payment Suggestions", paymentFlow: true, others: false },
  { name: "No Payment Processing Fees", paymentFlow: true, others: false },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage payments across your construction projects
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={CircleDollarSign}
            title="Integrated Payments"
            description="Connect with Checkbook.io for payouts and Finix for pay-ins, creating a seamless payment experience."
          />
          <FeatureCard 
            icon={FileSignature}
            title="Electronic Lien Releases"
            description="Generate and collect electronic signatures for lien releases before releasing payments."
          />
          <FeatureCard 
            icon={FileText}
            title="Invoice Management"
            description="Create, send, and track invoices with built-in payment links for faster collections."
          />
        </div>

        <div className="mt-16">
          <ComparisonTable 
            features={comparisonFeatures} 
            className="animate-fade-in"
          />
        </div>
      </div>
    </section>
  );
}
