import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';
import { PortfolioType } from 'types';

interface CreatePortfolioRequest {
  name: string;
  description?: string;
  type?: PortfolioType;
}

/**
 * Creates a new portfolio for the authenticated user.
 * @param request - The request object containing portfolio data
 * @param user - The user object
 * @returns A NextResponse with the created portfolio data
 */
export const createPortfolio = async (
  request: NextRequest,
  user: { id: string; role: string }
): Promise<NextResponse> => {
  try {
    const userId = user.id;
    const body: CreatePortfolioRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Portfolio name is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate portfolio type if provided
    const validTypes: PortfolioType[] = ['PERSONAL', 'RETIREMENT', 'TAXABLE', 'OTHER'];
    if (body.type && !validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid portfolio type' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const dbClient = await createDatabaseService();

    // Create the portfolio
    const portfolio = await dbClient.portfolio.create({
      userId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      type: body.type || 'PERSONAL',
    });

    return NextResponse.json({ portfolio }, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};