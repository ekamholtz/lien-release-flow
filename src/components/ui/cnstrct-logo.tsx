
import React from 'react';

interface CNSTRCTLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CNSTRCTLogo({ size = 'md', className = '' }: CNSTRCTLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/dc128673-c947-46ca-92e1-0db15f2a4c14.png" 
        alt="CNSTRCT Logo" 
        className={sizeClasses[size]}
      />
      <span className="ml-2 font-cnstrct font-semibold text-cnstrct-navy">
        {size === 'sm' ? 'CNSTRCT' : 'CNSTRCT Pay'}
      </span>
    </div>
  );
}
