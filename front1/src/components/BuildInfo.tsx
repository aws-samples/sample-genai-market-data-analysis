import React from 'react';

export interface BuildInfoProps {
  className?: string;
}

export const BuildInfo: React.FC<BuildInfoProps> = ({ className = '' }) => {
  const buildNumber = process.env.NEXT_PUBLIC_BUILD_NUMBER || 'dev';
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString().split('T')[0];
  
  return (
    <div className={`text-xs text-slate-400 ${className}`}>
      Build {buildNumber} • {buildDate}
    </div>
  );
};

export default BuildInfo;