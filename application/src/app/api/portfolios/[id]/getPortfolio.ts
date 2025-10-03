import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';

/**
 * Fetches a specific portfolio for the authenticated user.
 * @param request - The request object
 * @param user - The user object
 * @returns A NextResponse with the portfolio data
 */
export const getPortfolio = async (
  request: NextRequest,
  user: { id: string; role: string }
): Promise<NextResponse> => {
  try {
    const userId = user.id;
    const url = new URL(request.url);
    const portfolioId = url.pathname.split('/').pop();

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const dbClient = await createDatabaseService();

    // Get the portfolio
    const portfolio = await dbClient.portfolio.findById(portfolioId);

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check if the portfolio belongs to the user
    if (portfolio.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to access this portfolio' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Get holdings for this portfolio
    const holdings = await dbClient.holding.findByPortfolioId(portfolioId);

    return NextResponse.json({ 
      portfolio: {
        ...portfolio,
        holdings
      }
    }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};