import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';

/**
 * Fetches a specific holding from a portfolio.
 * @param request - The request object
 * @param user - The user object
 * @returns A NextResponse with the holding data
 */
export const getHolding = async (
  request: NextRequest,
  user: { id: string; role: string }
): Promise<NextResponse> => {
  try {
    const userId = user.id;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const holdingId = pathParts[pathParts.length - 1];
    const portfolioId = pathParts[pathParts.length - 3];

    if (!holdingId || !portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID and Holding ID are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const dbClient = await createDatabaseService();

    // Verify portfolio ownership
    const portfolio = await dbClient.portfolio.findById(portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    if (portfolio.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to access this portfolio' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Get the holding
    const holding = await dbClient.holding.findById(holdingId);
    if (!holding) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Verify holding belongs to this portfolio
    if (holding.portfolioId !== portfolioId) {
      return NextResponse.json(
        { error: 'Holding does not belong to this portfolio' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    return NextResponse.json({ holding }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching holding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holding' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};
