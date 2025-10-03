import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';
import { PortfolioType } from 'types';

interface EditPortfolioRequest {
  name?: string;
  description?: string;
  type?: PortfolioType;
}

/**
 * Updates a specific portfolio for the authenticated user.
 * @param request - The request object containing portfolio updates
 * @param user - The user object
 * @returns A NextResponse with the updated portfolio data
 */
export const editPortfolio = async (
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

    const body: EditPortfolioRequest = await request.json();

    // Validate portfolio type if provided
    if (body.type) {
      const validTypes: PortfolioType[] = ['PERSONAL', 'RETIREMENT', 'TAXABLE', 'OTHER'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Invalid portfolio type' },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
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
        { error: 'Unauthorized to update this portfolio' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Update the portfolio
    const updateData: Partial<EditPortfolioRequest> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.type !== undefined) updateData.type = body.type;

    const portfolio = await dbClient.portfolio.update(portfolioId, updateData);

    return NextResponse.json({ portfolio }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};