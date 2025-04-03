
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftRight, 
  FileSignature, 
  CircleDollarSign, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Building, 
  Briefcase, 
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RetroGrid } from '@/components/ui/retro-grid';
import { Card } from '@/components/ui/card';
import { TestimonialCard } from '@/components/landing/TestimonialCard';
import { ComparisonTable } from '@/components/landing/ComparisonTable';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
}) => (
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

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen">
      {/* Header */}
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
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-construction-50 to-gray-100 py-20 relative overflow-hidden">
        <RetroGrid className="opacity-30" angle={55} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Streamline Your Construction Payments
              </h1>
              <p className="mt-4 text-xl text-gray-600">
                Simplify your accounts payable and receivable processes with integrated payment solutions and automated lien releases.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  size="lg"
                  className="bg-construction-600 hover:bg-construction-700" 
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline" 
                  className="text-construction-600 border-construction-200"
                  onClick={() => navigate('/dashboard')}
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
      
      {/* Features */}
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
      
      {/* How It Works */}
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
      
      {/* Testimonials Section */}
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
      
      {/* For Different Roles */}
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
      
      {/* CTA */}
      <section className="py-16 bg-construction-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Streamline Your Construction Payments?</h2>
          <p className="text-xl text-construction-100 mb-8 max-w-3xl mx-auto">
            Join contractors and service professionals who are simplifying their payment processes
          </p>
          <Button 
            size="lg" 
            className="bg-white text-construction-600 hover:bg-gray-100"
            onClick={() => navigate('/auth')}
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-md bg-construction-500 flex items-center justify-center">
                  <ArrowLeftRight className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">PaymentFlow</span>
              </div>
              <p className="text-sm">
                Streamlining construction payments with integrated solutions for lien releases and accounting.
              </p>
            </div>
            
            <div>
              <h3 className="text-white text-lg font-medium mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">Case Studies</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white text-lg font-medium mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Webinars</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white text-lg font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Legal</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© 2023 PaymentFlow. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
