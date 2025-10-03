import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';

/**
 * Deletes a specific holding from a portfolio.
 * @param request - The request object
 * @param user - The user object
 * @returns A NextResponse confirming deletion
 */
export const deleteHolding = async (
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

    // Check if holding exists
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

    // Delete the holding
    await dbClient.holding.delete(holdingId);

    return NextResponse.json(
      { message: 'Holding deleted successfully' },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Error deleting holding:', error);
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};
