import React from 'react';
import { ContactForm } from '@/components/landing/ContactForm';
import { LandingLayout } from '../components/landing/LandingLayout';

export default function Contact() {
  return (
    <LandingLayout>
      <div className="py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Have questions or need assistance? Our support team is here to help.
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>
        <ContactForm />
      </div>
    </LandingLayout>
  );
}
