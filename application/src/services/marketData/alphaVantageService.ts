import { MarketDataService, StockQuote, CompanyInfo } from './marketDataService';
import { priceCacheService } from './priceCacheService';

/**
 * AlphaVantage API service implementation for market data
 */
export class AlphaVantageService extends MarketDataService {
  private apiKey: string | undefined;
  private baseUrl = 'https://www.alphavantage.co/query';
  private useMockData: boolean;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY;
    this.useMockData = !this.apiKey;

    if (this.useMockData) {
      console.log('[AlphaVantage] No API key found, using mock data');
    }
  }

  async getQuote(symbol: string): Promise<StockQuote | null> {
    // Check cache first
    const cachedQuote = await priceCacheService.getCachedPrice(symbol);
    if (cachedQuote) {
      console.log(`[AlphaVantage] Using cached price for ${symbol}`);
      return cachedQuote;
    }

    if (this.useMockData) {
      return this.getMockQuote(symbol);
    }

    try {
      const params = new URLSearchParams({
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase(),
        apikey: this.apiKey!
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        next: { revalidate: 300 } // Cache for 5 minutes
      });

      if (!response.ok) {
        console.error(`[AlphaVantage] API request failed: ${response.status}`);
        return this.getMockQuote(symbol); // Fallback to mock data
      }

      const data = await response.json();

      // Check for API rate limit or error messages
      if (data['Note'] || data['Error Message']) {
        console.error(`[AlphaVantage] API error:`, data['Note'] || data['Error Message']);
        return this.getMockQuote(symbol); // Fallback to mock data
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        console.warn(`[AlphaVantage] No data found for symbol: ${symbol}`);
        return null;
      }

      const stockQuote: StockQuote = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        lastUpdated: new Date(quote['07. latest trading day'])
      };

      // Cache the quote
      await priceCacheService.setCachedPrice(stockQuote);

      return stockQuote;
    } catch (error) {
      console.error(`[AlphaVantage] Error fetching quote for ${symbol}:`, error);
      return this.getMockQuote(symbol); // Fallback to mock data
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    // Batch fetch with rate limiting - free tier allows 5 calls/min
    const quotes: StockQuote[] = [];

    for (let i = 0; i < symbols.length; i++) {
      const quote = await this.getQuote(symbols[i]);
      if (quote) {
        quotes.push(quote);
      }

      // Add delay between calls to respect rate limits (5 calls/min = ~12 seconds between calls)
      if (!this.useMockData && i < symbols.length - 1) {
        await this.sleep(12000);
      }
    }

    return quotes;
  }

  async getCompanyInfo(symbol: string): Promise<CompanyInfo | null> {
    if (this.useMockData) {
      return this.getMockCompanyInfo(symbol);
    }

    try {
      const params = new URLSearchParams({
        function: 'OVERVIEW',
        symbol: symbol.toUpperCase(),
        apikey: this.apiKey!
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        next: { revalidate: 86400 } // Cache for 24 hours (company info changes rarely)
      });

      if (!response.ok) {
        console.error(`[AlphaVantage] API request failed: ${response.status}`);
        return this.getMockCompanyInfo(symbol);
      }

      const data = await response.json();

      if (data['Note'] || data['Error Message'] || !data['Symbol']) {
        console.error(`[AlphaVantage] API error:`, data['Note'] || data['Error Message']);
        return this.getMockCompanyInfo(symbol);
      }

      return {
        symbol: data['Symbol'],
        name: data['Name'],
        sector: data['Sector'] || 'Unknown',
        industry: data['Industry'] || 'Unknown',
        marketCap: data['MarketCapitalization'] ? parseInt(data['MarketCapitalization']) : undefined
      };
    } catch (error) {
      console.error(`[AlphaVantage] Error fetching company info for ${symbol}:`, error);
      return this.getMockCompanyInfo(symbol);
    }
  }

  async searchSymbols(query: string): Promise<{ symbol: string; name: string }[]> {
    if (this.useMockData) {
      return this.getMockSearchResults(query);
    }

    try {
      const params = new URLSearchParams({
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: this.apiKey!
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        console.error(`[AlphaVantage] API request failed: ${response.status}`);
        return this.getMockSearchResults(query);
      }

      const data = await response.json();

      if (data['Note'] || data['Error Message']) {
        console.error(`[AlphaVantage] API error:`, data['Note'] || data['Error Message']);
        return this.getMockSearchResults(query);
      }

      const matches = data['bestMatches'] || [];
      return matches.slice(0, 10).map((match: Record<string, string>) => ({
        symbol: match['1. symbol'],
        name: match['2. name']
      }));
    } catch (error) {
      console.error(`[AlphaVantage] Error searching symbols:`, error);
      return this.getMockSearchResults(query);
    }
  }

  async validateSymbol(symbol: string): Promise<boolean> {
    const quote = await this.getQuote(symbol);
    return quote !== null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMockQuote(symbol: string): StockQuote | null {
    const mockData: Record<string, Omit<StockQuote, 'symbol' | 'lastUpdated'>> = {
      'AAPL': { price: 175.25, change: 2.15, changePercent: 1.24, volume: 65432100 },
      'GOOGL': { price: 2845.75, change: -15.25, changePercent: -0.53, volume: 1234567 },
      'TSLA': { price: 245.80, change: 8.25, changePercent: 3.48, volume: 45678901 },
      'MSFT': { price: 415.60, change: 5.40, changePercent: 1.32, volume: 23456789 },
      'NVDA': { price: 875.45, change: 12.75, changePercent: 1.48, volume: 34567890 },
      'META': { price: 485.20, change: -8.30, changePercent: -1.68, volume: 18765432 },
      'AMZN': { price: 165.75, change: 3.25, changePercent: 2.00, volume: 41234567 },
      'NFLX': { price: 425.80, change: -2.45, changePercent: -0.57, volume: 8765432 },
      'SPY': { price: 485.60, change: 1.85, changePercent: 0.38, volume: 78901234 },
      'QQQ': { price: 395.40, change: 2.20, changePercent: 0.56, volume: 56789012 },
      'F': { price: 11.25, change: 0.15, changePercent: 1.35, volume: 89012345 },
      'GM': { price: 38.75, change: -0.85, changePercent: -2.15, volume: 12345678 },
    };

    const data = mockData[symbol.toUpperCase()];
    if (!data) return null;

    return {
      symbol: symbol.toUpperCase(),
      ...data,
      lastUpdated: new Date()
    };
  }

  private getMockCompanyInfo(symbol: string): CompanyInfo | null {
    const mockCompanies: Record<string, CompanyInfo> = {
      'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics' },
      'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', industry: 'Internet Content & Information' },
      'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', industry: 'Auto Manufacturers' },
      'MSFT': { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software' },
      'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors' },
      'META': { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Internet Content & Information' },
      'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', industry: 'Internet Retail' },
      'NFLX': { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', industry: 'Entertainment' },
      'SPY': { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF', industry: 'Exchange Traded Fund' },
      'QQQ': { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', industry: 'Exchange Traded Fund' },
      'F': { symbol: 'F', name: 'Ford Motor Company', sector: 'Consumer Discretionary', industry: 'Auto Manufacturers' },
      'GM': { symbol: 'GM', name: 'General Motors Company', sector: 'Consumer Discretionary', industry: 'Auto Manufacturers' },
    };

    return mockCompanies[symbol.toUpperCase()] || null;
  }

  private getMockSearchResults(query: string): { symbol: string; name: string }[] {
    const allSymbols = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
      { symbol: 'F', name: 'Ford Motor Company' },
      { symbol: 'GM', name: 'General Motors Company' },
    ];

    const searchTerm = query.toLowerCase();
    return allSymbols.filter(item => 
      item.symbol.toLowerCase().includes(searchTerm) || 
      item.name.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
  }
}