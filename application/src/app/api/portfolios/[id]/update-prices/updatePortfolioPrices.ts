import { HTTP_STATUS } from 'lib/api/http';
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseService } from 'services/database/databaseFactory';
import { marketDataService } from 'services/marketData/marketDataFactory';

/**
 * Updates prices for all holdings in a portfolio
 * @param request - The request object
 * @param user - The user object
 * @returns A NextResponse with the update results
 */
export const updatePortfolioPrices = async (
  request: NextRequest,
  user: { id: string; role: string }
): Promise<NextResponse> => {
  try {
    const userId = user.id;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const portfolioId = pathParts[pathParts.length - 2]; // Get ID before 'update-prices'

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
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

    // Get all holdings for this portfolio
    const holdings = await dbClient.holding.findByPortfolioId(portfolioId);

    if (holdings.length === 0) {
      return NextResponse.json({
        message: 'No holdings to update',
        updated: 0,
        errors: []
      }, { status: HTTP_STATUS.OK });
    }

    // Get unique symbols
    const symbols = [...new Set(holdings.map(h => h.symbol))];

    console.log(`[UpdatePrices] Fetching prices for ${symbols.length} symbols`);

    // Fetch quotes for all symbols
    const quotes = await marketDataService.getMultipleQuotes(symbols);

    // Build update map
    const priceUpdates: { symbol: string; price: number; sector?: string }[] = [];
    const errors: string[] = [];

    for (const symbol of symbols) {
      const quote = quotes.find(q => q.symbol.toUpperCase() === symbol.toUpperCase());

      if (quote) {
        priceUpdates.push({
          symbol: symbol.toUpperCase(),
          price: quote.price
        });

        // Also fetch and update sector if not already set
        const holdingsForSymbol = holdings.filter(h => h.symbol.toUpperCase() === symbol.toUpperCase());
        if (holdingsForSymbol.some(h => !h.sector)) {
          try {
            const companyInfo = await marketDataService.getCompanyInfo(symbol);
            if (companyInfo?.sector) {
              for (const holding of holdingsForSymbol) {
                if (!holding.sector) {
                  await dbClient.holding.update(holding.id, { sector: companyInfo.sector });
                }
              }
            }
          } catch (error) {
            console.warn(`[UpdatePrices] Could not fetch sector for ${symbol}:`, error);
          }
        }
      } else {
        errors.push(`Failed to fetch price for ${symbol}`);
      }
    }

    // Update all holdings with new prices
    if (priceUpdates.length > 0) {
      // Update all holdings in the portfolio with their current prices
      for (const holding of holdings) {
        const update = priceUpdates.find(u => u.symbol.toUpperCase() === holding.symbol.toUpperCase());
        if (update) {
          await dbClient.holding.update(holding.id, { currentPrice: update.price });
        }
      }
    }

    return NextResponse.json({
      message: `Updated prices for ${priceUpdates.length} symbols`,
      updated: priceUpdates.length,
      total: symbols.length,
      errors: errors.length > 0 ? errors : undefined
    }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error updating portfolio prices:', error);
    return NextResponse.json(
      { error: 'Failed to update prices' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
};
