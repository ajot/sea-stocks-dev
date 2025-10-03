import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';

/**
 * Deletes a specific portfolio for the authenticated user.
 * @param request - The request object
 * @param user - The user object
 * @returns A NextResponse confirming deletion
 */
export const deletePortfolio = async (
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

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await dbClient.portfolio.findById(portfolioId);
    if (!existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    if (existingPortfolio.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this portfolio' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Delete the portfolio (holdings will be cascade deleted due to schema constraint)
    await dbClient.portfolio.delete(portfolioId);

    return NextResponse.json(
      { message: 'Portfolio deleted successfully' },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to delete portfolio' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};