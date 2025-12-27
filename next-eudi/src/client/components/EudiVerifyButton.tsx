// Pre-built verification button component

'use client';

import React from 'react';

export const EudiVerifyButton: React.FC<{ minAge: number }> = ({ minAge }) => {
  // TODO: Implement button with verification flow
  return (
    <button onClick={() => console.log('Verify age', minAge)}>
      Verify Age ({minAge}+)
    </button>
  );
};
