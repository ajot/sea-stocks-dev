export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: 'PERSONAL' | 'RETIREMENT' | 'TAXABLE' | 'OTHER';
  createdAt: string;
  updatedAt: string;
  holdings?: Holding[];
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  shares: number;
  costBasis: number;
  purchaseDate: string;
  currentPrice: number | null;
  sector: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioData {
  name: string;
  description?: string;
  type?: 'PERSONAL' | 'RETIREMENT' | 'TAXABLE' | 'OTHER';
}

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
  type?: 'PERSONAL' | 'RETIREMENT' | 'TAXABLE' | 'OTHER';
}

export interface CreateHoldingData {
  symbol: string;
  shares: number;
  costBasis: number;
  purchaseDate: string;
}

export interface UpdateHoldingData {
  shares?: number;
  costBasis?: number;
  purchaseDate?: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
}

/**
 * API client for managing portfolios and holdings
 * This client provides methods to interact with the portfolios API
 */
export class PortfoliosApiClient {
  constructor(private baseURL = '/api/portfolios') {}

  // Fetch all portfolios
  async getPortfolios(): Promise<{ portfolios: Portfolio[] }> {
    const res = await fetch(`${this.baseURL}`);
    if (!res.ok) throw new Error('Failed to fetch portfolios');
    return res.json();
  }

  // Fetch a specific portfolio with holdings
  async getPortfolio(id: string): Promise<{ portfolio: Portfolio }> {
    const res = await fetch(`${this.baseURL}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    return res.json();
  }

  // Create a new portfolio
  async createPortfolio(portfolioData: CreatePortfolioData): Promise<{ portfolio: Portfolio }> {
    const res = await fetch(`${this.baseURL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portfolioData),
    });
    if (!res.ok) throw new Error('Failed to create portfolio');
    return res.json();
  }

  // Update a portfolio
  async updatePortfolio(id: string, updateData: UpdatePortfolioData): Promise<{ portfolio: Portfolio }> {
    const res = await fetch(`${this.baseURL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update portfolio');
    return res.json();
  }

  // Delete a portfolio
  async deletePortfolio(id: string): Promise<void> {
    const res = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete portfolio');
  }

  // Fetch holdings for a portfolio
  async getHoldings(portfolioId: string): Promise<{ holdings: Holding[] }> {
    const res = await fetch(`${this.baseURL}/${portfolioId}/holdings`);
    if (!res.ok) throw new Error('Failed to fetch holdings');
    return res.json();
  }

  // Add a holding to a portfolio
  async createHolding(portfolioId: string, holdingData: CreateHoldingData): Promise<{ holding: Holding }> {
    const res = await fetch(`${this.baseURL}/${portfolioId}/holdings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(holdingData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create holding');
    }
    return res.json();
  }

  // Update a holding
  async updateHolding(portfolioId: string, holdingId: string, updateData: UpdateHoldingData): Promise<{ holding: Holding }> {
    const res = await fetch(`${this.baseURL}/${portfolioId}/holdings/${holdingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update holding');
    return res.json();
  }

  // Delete a holding
  async deleteHolding(portfolioId: string, holdingId: string): Promise<void> {
    const res = await fetch(`${this.baseURL}/${portfolioId}/holdings/${holdingId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete holding');
  }

  // Get stock quote
  async getStockQuote(symbol: string): Promise<{ quote: StockQuote }> {
    const res = await fetch(`/api/market-data/quote/${symbol}`);
    if (!res.ok) throw new Error('Failed to fetch stock quote');
    return res.json();
  }

  // Update prices for all holdings in a portfolio
  async updatePortfolioPrices(portfolioId: string): Promise<{ message: string; updated: number; total: number; errors?: string[] }> {
    const res = await fetch(`${this.baseURL}/${portfolioId}/update-prices`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to update portfolio prices');
    return res.json();
  }
}