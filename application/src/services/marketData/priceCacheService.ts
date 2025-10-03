import { createDatabaseService } from '../database/databaseFactory';
import { StockQuote } from './marketDataService';

export class PriceCacheService {
  private cacheExpiryMinutes: number;

  constructor(cacheExpiryMinutes: number = 5) {
    this.cacheExpiryMinutes = cacheExpiryMinutes;
  }

  /**
   * Get cached price for a symbol if it exists and is not expired
   */
  async getCachedPrice(symbol: string): Promise<StockQuote | null> {
    try {
      const dbClient = await createDatabaseService();
      const cached = await dbClient.priceCache.findBySymbol(symbol.toUpperCase());

      if (!cached) {
        return null;
      }

      // Check if cache is expired
      const now = new Date();
      const cacheAge = (now.getTime() - cached.lastUpdated.getTime()) / 1000 / 60; // Age in minutes

      if (cacheAge > this.cacheExpiryMinutes) {
        return null; // Cache expired
      }

      return {
        symbol: cached.symbol,
        price: Number(cached.price),
        change: Number(cached.change),
        changePercent: Number(cached.changePercent),
        volume: Number(cached.volume),
        lastUpdated: cached.lastUpdated
      };
    } catch (error) {
      console.error('[PriceCacheService] Error getting cached price:', error);
      return null;
    }
  }

  /**
   * Store or update cached price for a symbol
   */
  async setCachedPrice(quote: StockQuote): Promise<void> {
    try {
      const dbClient = await createDatabaseService();

      await dbClient.priceCache.upsert({
        symbol: quote.symbol.toUpperCase(),
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        lastUpdated: quote.lastUpdated || new Date()
      });
    } catch (error) {
      console.error('[PriceCacheService] Error setting cached price:', error);
    }
  }

  /**
   * Get multiple cached prices
   */
  async getMultipleCachedPrices(symbols: string[]): Promise<Map<string, StockQuote>> {
    const cachedPrices = new Map<string, StockQuote>();

    for (const symbol of symbols) {
      const cached = await this.getCachedPrice(symbol);
      if (cached) {
        cachedPrices.set(symbol.toUpperCase(), cached);
      }
    }

    return cachedPrices;
  }

  /**
   * Clear cached price for a symbol
   */
  async clearCachedPrice(symbol: string): Promise<void> {
    try {
      const dbClient = await createDatabaseService();
      await dbClient.priceCache.deleteBySymbol(symbol.toUpperCase());
    } catch (error) {
      console.error('[PriceCacheService] Error clearing cached price:', error);
    }
  }

  /**
   * Clear all cached prices
   */
  async clearAllCache(): Promise<void> {
    try {
      const dbClient = await createDatabaseService();
      await dbClient.priceCache.deleteAll();
    } catch (error) {
      console.error('[PriceCacheService] Error clearing all cache:', error);
    }
  }
}

export const priceCacheService = new PriceCacheService();
