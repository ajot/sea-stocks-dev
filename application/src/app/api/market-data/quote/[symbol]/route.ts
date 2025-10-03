import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from 'services/marketData/marketDataFactory';

/**
 * GET handler for fetching stock quotes by symbol
 * @param request - The NextRequest object containing the symbol parameter
 * @returns NextResponse with quote data or error
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const symbol = pathParts[pathParts.length - 1];

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const quote = await marketDataService.getQuote(symbol.toUpperCase());
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Symbol not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json({ quote }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}