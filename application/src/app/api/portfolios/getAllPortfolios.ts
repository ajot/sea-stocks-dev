import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';

/**
 * Fetches all portfolios for the authenticated user.
 * @param request - The request object
 * @param user - The user object
 * @returns A NextResponse with properly typed portfolio data
 */
export const getAllPortfolios = async (
  request: NextRequest,
  user: { id: string; role: string }
): Promise<NextResponse> => {
  try {
    const userId = user.id;
    const dbClient = await createDatabaseService();

    // Get all portfolios for the user
    const portfolios = await dbClient.portfolio.findByUserId(userId);

    // Fetch holdings for each portfolio
    const portfoliosWithHoldings = await Promise.all(
      portfolios.map(async (portfolio) => {
        const holdings = await dbClient.holding.findByPortfolioId(portfolio.id);
        return {
          ...portfolio,
          holdings
        };
      })
    );

    // Return portfolios with holdings
    return NextResponse.json({ portfolios: portfoliosWithHoldings }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};