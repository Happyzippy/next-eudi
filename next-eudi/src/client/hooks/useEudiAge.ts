// Hook for age verification

'use client';

export function useEudiAge(minAge: number) {
  // TODO: Implement hook logic
  console.log('useEudiAge hook', { minAge });
  
  return {
    status: 'unknown' as const,
    requestAgeProof: async () => {
      console.log('Requesting age proof...');
    }
  };
}
