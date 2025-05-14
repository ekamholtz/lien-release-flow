
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
  { name: "Approval Workflows", paymentFlow: true, others: false },
  { name: "Mobile Responsive Interface", paymentFlow: true, others: true },
  { name: "Accelerated ACH Processing", paymentFlow: true, others: false },
  { name: "Pay Vendors via Text or Email", paymentFlow: true, others: false },
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
            description="Connect with our integrated payment providers for the fastest and most cost effective way to send and collect electronic payments"
          />
          <FeatureCard 
            icon={FileSignature}
            title="Electronic Lien Releases"
            description="Generate and collect electronic signatures for lien releases before releasing payments - All automatically through our project workflows"
          />
          <FeatureCard 
            icon={FileText}
            title="Cash Management"
            description="Organize Invoices, Bills, and Payments by project, PM, or job type. - Make your financial data work for project based businesses to gain insights into their business"
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
