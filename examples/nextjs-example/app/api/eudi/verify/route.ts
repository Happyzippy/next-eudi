// API route for verifying EUDI presentations

import { verifyAgeWithEudi } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { presentation, minAge = 18 } = body;
    
    if (!presentation) {
      return NextResponse.json(
        { error: 'presentation is required' },
        { status: 400 }
      );
    }
    
    // Verify the presentation
    // Note: In testing, we skip signature verification
    // In production, you would provide the issuer's public key
    const result = await verifyAgeWithEudi(presentation, minAge, {
      skipSignatureVerification: true // TESTING ONLY
    });
    
    return NextResponse.json({
      success: result.isOldEnough,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
