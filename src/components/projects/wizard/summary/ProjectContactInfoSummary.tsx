
import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

interface ProjectContactInfoSummaryProps {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export function ProjectContactInfoSummary({
  contactName,
  contactEmail,
  contactPhone
}: ProjectContactInfoSummaryProps) {
  if (!contactName && !contactEmail && !contactPhone) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 mb-2">Contact Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contactName && (
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-1" /> Contact Name
            </p>
            <p className="text-sm text-gray-600">{contactName}</p>
          </div>
        )}
        
        {contactEmail && (
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center">
              <Mail className="h-4 w-4 mr-1" /> Email
            </p>
            <p className="text-sm text-gray-600">{contactEmail}</p>
          </div>
        )}
        
        {contactPhone && (
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center">
              <Phone className="h-4 w-4 mr-1" /> Phone
            </p>
            <p className="text-sm text-gray-600">{contactPhone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
