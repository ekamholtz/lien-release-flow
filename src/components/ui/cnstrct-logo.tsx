
import React from 'react';

interface CNSTRCTLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CNSTRCTLogo({ size = 'md', className = '' }: CNSTRCTLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto',
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/4e1daa8f-8034-410f-8dfd-b18b35e060e9.png" 
        alt="CNSTRCT Logo" 
        className={sizeClasses[size]}
      />
      <span className="ml-2 font-cnstrct font-semibold text-cnstrct-navy">
        {size === 'sm' ? 'CNSTRCT' : 'CNSTRCT Pay'}
      </span>
    </div>
  );
}
