// React Provider for EUDI configuration

'use client';

import React from 'react';

export const EudiProvider: React.FC<{ children: React.ReactNode; apiBaseUrl: string }> = ({ 
  children, 
  apiBaseUrl 
}) => {
  // TODO: Implement context provider
  console.log('EudiProvider initialized', { apiBaseUrl });
  return <>{children}</>;
};
