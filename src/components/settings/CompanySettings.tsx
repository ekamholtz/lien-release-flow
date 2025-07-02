
import React from 'react';
import { CompanyProfileForm } from '@/components/company/CompanyProfileForm';

export function CompanySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Company Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your company profile, branding, and contact information.
        </p>
      </div>
      <CompanyProfileForm />
    </div>
  );
}
