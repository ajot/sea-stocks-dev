import { MarketDataService } from './marketDataService';
import { AlphaVantageService } from './alphaVantageService';

export class MarketDataFactory {
  private static instance: MarketDataService | null = null;

  static createMarketDataService(): MarketDataService {
    if (!MarketDataFactory.instance) {
      // For Phase 1, always use AlphaVantage (with mock data)
      MarketDataFactory.instance = new AlphaVantageService();
    }
    return MarketDataFactory.instance;
  }
}

export const marketDataService = MarketDataFactory.createMarketDataService();