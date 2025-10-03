export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: Date;
}

export interface CompanyInfo {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap?: number;
}

export abstract class MarketDataService {
  abstract getQuote(symbol: string): Promise<StockQuote | null>;
  abstract getMultipleQuotes(symbols: string[]): Promise<StockQuote[]>;
  abstract getCompanyInfo(symbol: string): Promise<CompanyInfo | null>;
  abstract searchSymbols(query: string): Promise<{ symbol: string; name: string }[]>;
  abstract validateSymbol(symbol: string): Promise<boolean>;
}