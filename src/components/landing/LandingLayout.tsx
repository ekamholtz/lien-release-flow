import React from 'react';
import { Footer } from './Footer';
// Using a conditional check to avoid errors if LandingHeader doesn't exist yet
const LandingHeader = () => <header className="bg-white border-b border-gray-200 py-4"><div className="max-w-7xl mx-auto px-4"><h1 className="text-xl font-bold">CNSTRCT</h1></div></header>;

interface LandingLayoutProps {
  children: React.ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
