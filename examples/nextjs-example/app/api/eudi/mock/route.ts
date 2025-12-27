// API route for testing - generates mock EUDI presentations
// This simulates what a real EUDI wallet would return

import { createMockPresentation } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const age = parseInt(searchParams.get('age') || '25', 10);
    
    // Generate mock presentation with specified age
    const presentation = await createMockPresentation(age, {
      includeAge: true,
      includeBirthdate: true
    });
    
    return NextResponse.json({
      presentation,
      message: `Generated mock presentation for age ${age}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
