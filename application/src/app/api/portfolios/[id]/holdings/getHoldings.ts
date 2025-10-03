import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';

/**
 * Fetches all holdings for a specific portfolio.
 * @param request - The request object
 * @param user - The user object
 * @returns A NextResponse with holdings data
 */
export const getHoldings = async (
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
        { error: 'Unauthorized to access this portfolio' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Get holdings for the portfolio
    const holdings = await dbClient.holding.findByPortfolioId(portfolioId);

    return NextResponse.json({ holdings }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holdings' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};