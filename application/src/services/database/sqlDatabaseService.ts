import { DatabaseClient } from './database';
import { prisma } from '../../lib/prisma';
import { Subscription, Note, User, UserWithSubscriptions, SubscriptionStatus, Portfolio, Holding, PriceCache } from 'types';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ServiceConfigStatus } from '../status/serviceConfigStatus';

// Helper function to convert Decimal to number
const convertDecimalToNumber = (value: Decimal | null): number | null => {
  return value ? value.toNumber() : null;
};

/**
 * Service for interacting with the SQL database using Prisma.
 */
export class SqlDatabaseService extends DatabaseClient {
  // Service name for consistent display across all status responses
  private static readonly serviceName = 'Database (PostgreSQL)';
  private description: string =
    'The following features are impacted: overall app functionality, user, subscription and notes management';

  // Required config items with their corresponding env var names and descriptions
  private static requiredConfig = {
    databaseUrl: { envVar: 'DATABASE_URL', description: 'PostgreSQL connection string' },
  };
  private lastConnectionError: string = '';

  constructor() {
    super();
  }

  user = {
    findById: async (id: string) => {
      return prisma.user.findUnique({ where: { id } });
    },
    findByEmail: async (email: string) => {
      return prisma.user.findUnique({ where: { email } });
    },
    findByEmailAndPassword: async (email: string, passwordHash: string) => {
      return prisma.user.findFirst({ where: { email, passwordHash } });
    },
    findByVerificationToken: async (token: string) => {
      return prisma.user.findFirst({ where: { verificationToken: token } });
    },
    findAll: async (options?: {
      page?: number;
      pageSize?: number;
      searchName?: string;
      filterPlan?: string;
      filterStatus?: string;
    }): Promise<{ users: UserWithSubscriptions[]; total: number }> => {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 10;
      const skip = (page - 1) * pageSize;
      const where: Record<string, unknown> = {};
      if (options?.searchName) {
        where.name = { contains: options.searchName, mode: 'insensitive' };
      }
      if (options?.filterPlan || options?.filterStatus) {
        where.subscription = { plan: {}, status: {} };
        if (options.filterPlan) {
          (where.subscription as { plan: Record<string, unknown> }).plan = {
            equals: options.filterPlan,
          };
        }
        if (options.filterStatus) {
          (where.subscription as { status: Record<string, unknown> }).status = {
            equals: options.filterStatus,
          };
        }
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { subscription: true },
          orderBy: { name: 'asc' },
          skip,
          take: pageSize,
        }),
        prisma.user.count({ where }),
      ]);
      return { users, total };
    },
    create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
      const newUser = await prisma.user.create({ data: user });
      return newUser;
    },
    update: async (id: string, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> => {
      return prisma.user.update({ where: { id }, data: user });
    },
    updateByEmail: async (
      email: string,
      user: Partial<Omit<User, 'id' | 'createdAt'>>
    ): Promise<User> => {
      return prisma.user.update({ where: { email }, data: user });
    },
    delete: async (id: string): Promise<void> => {
      await prisma.user.delete({ where: { id } });
    },
    count: async (): Promise<number> => {
      return prisma.user.count();
    },
  };
  subscription = {
    findByUserAndStatus: async (
      userId: string,
      status: SubscriptionStatus
    ): Promise<Subscription | null> => {
      return prisma.subscription.findFirst({
        where: { userId, status },
      });
    },
    findById: async (id: string): Promise<Subscription | null> => {
      return prisma.subscription.findUnique({ where: { id } });
    },
    findByUserId: async (userId: string): Promise<Subscription[]> => {
      return prisma.subscription.findMany({ where: { userId } });
    },
    create: async (subscription: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> => {
      return prisma.subscription.create({ data: subscription });
    },
    update: async (
      userId: string,
      subscription: Partial<Omit<Subscription, 'id' | 'createdAt'>>
    ): Promise<Subscription> => {
      return prisma.subscription.update({ where: { userId }, data: subscription });
    },
    updateByCustomerId: async (
      customerId: string,
      subscription: Partial<Omit<Subscription, 'id' | 'createdAt'>>
    ): Promise<Subscription> => {
      const existing = await prisma.subscription.findFirst({ where: { customerId } });
      if (!existing) throw new Error('Subscription not found for customerId');
      return prisma.subscription.update({ where: { id: existing.id }, data: subscription });
    },
    delete: async (id: string): Promise<void> => {
      await prisma.subscription.delete({ where: { id } });
    },
  };
  // Note: The note table has been removed from the schema in favor of portfolios
  // This is a placeholder to maintain compatibility with the DatabaseClient interface
  /* eslint-disable @typescript-eslint/no-unused-vars */
  note = {
    findById: async (_id: string): Promise<Note | null> => {
      throw new Error('Note functionality has been removed. Use portfolios instead.');
    },
    findByUserId: async (_userId: string): Promise<Note[]> => {
      throw new Error('Note functionality has been removed. Use portfolios instead.');
    },
    create: async (_note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> => {
      throw new Error('Note functionality has been removed. Use portfolios instead.');
    },
    update: async (_id: string, _note: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> => {
      throw new Error('Note functionality has been removed. Use portfolios instead.');
    },
    delete: async (_id: string): Promise<void> => {
      throw new Error('Note functionality has been removed. Use portfolios instead.');
    },
    findMany: async (_args: {
      userId: string;
      search?: string;
      skip: number;
      take: number;
      orderBy: {
        createdAt?: 'desc' | 'asc';
        title?: 'asc';
      };
    }) => {
      throw new Error('Note functionality has been removed. Use portfolios instead.');
    },
    count: async (_userId: string, _search?: string) => {
      throw new Error('Note functionality has been removed. Use portfolios instead.');
    },
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

  portfolio = {
    findById: async (id: string) => {
      return prisma.portfolio.findUnique({ where: { id } });
    },
    findByUserId: async (userId: string) => {
      return prisma.portfolio.findMany({ 
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    },
    create: async (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => {
      return prisma.portfolio.create({ data: portfolio });
    },
    update: async (id: string, portfolio: Partial<Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return prisma.portfolio.update({ 
        where: { id }, 
        data: portfolio 
      });
    },
    delete: async (id: string) => {
      await prisma.portfolio.delete({ where: { id } });
    },
    count: async (userId: string) => {
      return prisma.portfolio.count({ where: { userId } });
    },
  };

  holding = {
    findById: async (id: string) => {
      const result = await prisma.holding.findUnique({ where: { id } });
      if (!result) return null;
      
      return {
        ...result,
        shares: result.shares.toNumber(),
        costBasis: result.costBasis.toNumber(),
        currentPrice: convertDecimalToNumber(result.currentPrice)
      };
    },
    findByPortfolioId: async (portfolioId: string) => {
      const results = await prisma.holding.findMany({ 
        where: { portfolioId },
        orderBy: { createdAt: 'desc' }
      });
      
      return results.map(result => ({
        ...result,
        shares: result.shares.toNumber(),
        costBasis: result.costBasis.toNumber(),
        currentPrice: convertDecimalToNumber(result.currentPrice)
      }));
    },
    findBySymbol: async (portfolioId: string, symbol: string) => {
      const result = await prisma.holding.findUnique({
        where: { portfolioId_symbol: { portfolioId, symbol } }
      });
      
      if (!result) return null;
      
      return {
        ...result,
        shares: result.shares.toNumber(),
        costBasis: result.costBasis.toNumber(),
        currentPrice: convertDecimalToNumber(result.currentPrice)
      };
    },
    create: async (holding: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await prisma.holding.create({ data: holding });
      return {
        ...result,
        shares: result.shares.toNumber(),
        costBasis: result.costBasis.toNumber(),
        currentPrice: convertDecimalToNumber(result.currentPrice)
      };
    },
    update: async (id: string, holding: Partial<Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const result = await prisma.holding.update({ 
        where: { id }, 
        data: holding 
      });
      return {
        ...result,
        shares: result.shares.toNumber(),
        costBasis: result.costBasis.toNumber(),
        currentPrice: convertDecimalToNumber(result.currentPrice)
      };
    },
    delete: async (id: string) => {
      await prisma.holding.delete({ where: { id } });
    },
    updatePrices: async (updates: { symbol: string; price: number }[]) => {
      const updatePromises = updates.map(({ symbol, price }) =>
        prisma.holding.updateMany({
          where: { symbol },
          data: { currentPrice: price }
        })
      );
      await Promise.all(updatePromises);
    },
  };

  verificationToken = {
    create: async (data: { identifier: string; token: string; expires: Date }) => {
      await prisma.verificationToken.create({ data });
    },
    find: async (identifier: string, token: string) => {
      return prisma.verificationToken.findUnique({
        where: { identifier_token: { identifier, token } },
      });
    },
    findByToken: async (token: string) => {
      return prisma.verificationToken.findFirst({ where: { token } });
    },
    delete: async (identifier: string, token: string) => {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      });
    },
    deleteExpired: async (now: Date) => {
      await prisma.verificationToken.deleteMany({
        where: { expires: { lt: now } },
      });
    },
  };

  priceCache = {
    findBySymbol: async (symbol: string): Promise<PriceCache | null> => {
      const result = await prisma.priceCache.findUnique({
        where: { symbol: symbol.toUpperCase() }
      });
      
      if (!result) return null;
      
      return {
        ...result,
        price: result.price.toNumber(),
        change: result.change.toNumber(),
        changePercent: result.changePercent.toNumber(),
        volume: Number(result.volume)
      };
    },
    upsert: async (data: Omit<PriceCache, 'id' | 'createdAt'>): Promise<PriceCache> => {
      const result = await prisma.priceCache.upsert({
        where: { symbol: data.symbol.toUpperCase() },
        update: {
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume,
          lastUpdated: data.lastUpdated
        },
        create: {
          symbol: data.symbol.toUpperCase(),
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume,
          lastUpdated: data.lastUpdated
        }
      });
      
      return {
        ...result,
        price: result.price.toNumber(),
        change: result.change.toNumber(),
        changePercent: result.changePercent.toNumber(),
        volume: Number(result.volume)
      };
    },
    deleteBySymbol: async (symbol: string): Promise<void> => {
      await prisma.priceCache.delete({
        where: { symbol: symbol.toUpperCase() }
      });
    },
    deleteAll: async (): Promise<void> => {
      await prisma.priceCache.deleteMany();
    }
  };
  /**
   * Checks if the database service is properly configured and accessible.
   * Tests the connection by performing a simple query.
   * Creates a fresh Prisma client to test the current DATABASE_URL.
   *
   * @returns {Promise<boolean>} True if the connection is successful, false otherwise.
   */
  async checkConnection(): Promise<boolean> {
    let testClient: PrismaClient | null = null;

    try {
      // Create a fresh Prisma client to test the current DATABASE_URL
      // This ensures we're testing with the latest environment variable value
      testClient = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Test connection by performing a simple query
      await testClient.$queryRaw`SELECT 1`;
      return true;
    } catch (connectionError) {
      const errorMsg =
        connectionError instanceof Error ? connectionError.message : String(connectionError);

      console.error('Database connection test failed:', {
        error: errorMsg,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      });

      this.lastConnectionError = `Connection error: ${errorMsg}`;
      return false;
    } finally {
      // Always disconnect the test client to avoid connection leaks
      if (testClient) {
        await testClient.$disconnect();
      }
    }
  }

  /**
   * Checks if the database service configuration is valid and tests connection when configuration is complete.
   */
  async checkConfiguration(): Promise<ServiceConfigStatus> {
    // Check for missing configuration
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return {
        name: SqlDatabaseService.serviceName,
        configured: false,
        connected: undefined, // Don't test connection when configuration is missing
        configToReview: ['DATABASE_URL'],
        error: 'Configuration missing',
        description: this.description,
      };
    }

    // If configured, test the connection
    const isConnected = await this.checkConnection();
    if (!isConnected) {
      return {
        name: SqlDatabaseService.serviceName,
        configured: true,
        connected: false,
        configToReview: ['DATABASE_URL'],
        error: this.lastConnectionError || 'Connection failed',
        description: this.description,
      };
    }
    return {
      name: SqlDatabaseService.serviceName,
      configured: true,
      connected: true,
    };
  }
}
