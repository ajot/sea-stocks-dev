import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';
import { marketDataService } from 'services/marketData/marketDataFactory';

interface CreateHoldingRequest {
  symbol: string;
  shares: number;
  costBasis: number;
  purchaseDate: string;
}

/**
 * Creates a new holding in a specific portfolio.
 * @param request - The request object containing holding data
 * @param user - The user object
 * @returns A NextResponse with the created holding data
 */
export const createHolding = async (
  request: NextRequest,
  user: { id: string; role: string }
): Promise<NextResponse> => {
  try {
    const userId = user.id;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const portfolioId = pathParts[pathParts.findIndex(part => part === 'portfolios') + 1];

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const body: CreateHoldingRequest = await request.json();

    // Validate required fields
    if (!body.symbol || !body.shares || !body.costBasis || !body.purchaseDate) {
      return NextResponse.json(
        { error: 'Symbol, shares, cost basis, and purchase date are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate numbers
    if (body.shares <= 0 || body.costBasis <= 0) {
      return NextResponse.json(
        { error: 'Shares and cost basis must be positive numbers' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const dbClient = await createDatabaseService();

    // Verify portfolio belongs to user
    const portfolio = await dbClient.portfolio.findById(portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    if (portfolio.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to add holdings to this portfolio' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Validate stock symbol and get current price & sector info
    const quote = await marketDataService.getQuote(body.symbol.toUpperCase());
    const companyInfo = await marketDataService.getCompanyInfo(body.symbol.toUpperCase());
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Invalid stock symbol' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if holding already exists
    const existingHolding = await dbClient.holding.findBySymbol(portfolioId, body.symbol.toUpperCase());
    if (existingHolding) {
      return NextResponse.json(
        { error: 'Holding for this symbol already exists in this portfolio' },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Create the holding
    const holding = await dbClient.holding.create({
      portfolioId,
      symbol: body.symbol.toUpperCase(),
      shares: body.shares,
      costBasis: body.costBasis,
      purchaseDate: new Date(body.purchaseDate),
      currentPrice: quote.price,
      sector: companyInfo?.sector || null,
    });

    return NextResponse.json({ holding }, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    console.error('Error creating holding:', error);
    return NextResponse.json(
      { error: 'Failed to create holding' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};