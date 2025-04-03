
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  className?: string;
}

export function TestimonialCard({ 
  quote, 
  author, 
  role, 
  company,
  className
}: TestimonialCardProps) {
  return (
    <Card className={cn(
      "bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all", 
      className
    )}>
      <CardContent className="pt-6">
        <div className="mb-4 text-construction-500">
          <svg 
            width="45" 
            height="36" 
            className="fill-current opacity-80"
            viewBox="0 0 45 36" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M13.415.43c-2.523 0-4.708.893-6.551 2.68C4.939 5.036 3.65 7.22 2.916 9.86 2.184 12.32 1.817 14.9 1.817 17.575c0 8.28 2.234 14.931 6.704 19.948A20.19 20.19 0 0013.57 42.21c2.68.835 5.22 1.253 7.622 1.253 1.41 0 2.68-.197 3.812-.592a5.874 5.874 0 002.68-1.826c.653-.835.979-1.865.979-3.092 0-1.41-.346-2.521-1.039-3.337-.692-.835-1.728-1.253-3.104-1.253-.938 0-2.254.317-3.948.95-1.694.631-3.034.947-4.027.947-1.964 0-3.452-.913-4.466-2.74-1.013-1.866-1.52-4.167-1.52-6.903 0-3.337.721-6.356 2.164-9.053a4.206 4.206 0 01-1.15-.83A7.55 7.55 0 019.7 13.51c-.285-.67-.427-1.351-.427-2.044 0-2.282.866-4.125 2.599-5.731C13.605 4.147 15.338 3.26 17.263 3.1c-.469-1.826-1.52-2.74-3.156-2.74-.469 0-.692.053-.672.13l-.02-.06z" />
          </svg>
        </div>
        <p className="text-gray-700 mb-6">{quote}</p>
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-construction-100 flex items-center justify-center mr-3">
            <span className="text-construction-600 font-semibold">
              {author.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{author}</p>
            <p className="text-sm text-gray-500">{role}, {company}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
