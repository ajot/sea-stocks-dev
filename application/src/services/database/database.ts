import { Note, Subscription, User, UserWithSubscriptions, SubscriptionStatus, Portfolio, Holding, PortfolioType, PriceCache } from 'types';
import { ServiceConfigStatus, ConfigurableService } from '../status/serviceConfigStatus';

export type DatabaseProvider = 'Postgres';

export type QueryParams = unknown[];

/**
 * Abstract base class for database clients.
 * Provides a common interface for database operations across different database providers.
 */
export abstract class DatabaseClient implements ConfigurableService {
  abstract user: {
    findById: (id: string) => Promise<User | null>;
    findByEmail: (email: string) => Promise<User | null>;
    findByEmailAndPassword: (email: string, passwordHash: string) => Promise<User | null>;
    findByVerificationToken: (token: string) => Promise<User | null>;
    findAll: (options?: {
      page?: number;
      pageSize?: number;
      searchName?: string;
      filterPlan?: string;
      filterStatus?: string;
    }) => Promise<{ users: UserWithSubscriptions[]; total: number }>;
    create: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
    update: (id: string, user: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<User>;
    delete: (id: string) => Promise<void>;
    count: () => Promise<number>;
    updateByEmail: (email: string, user: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<User>;
  };
  abstract subscription: {
    findByUserAndStatus: (
      userId: string,
      status: SubscriptionStatus
    ) => Promise<Subscription | null>;
    findById: (id: string) => Promise<Subscription | null>;
    findByUserId: (userId: string) => Promise<Subscription[]>;
    create: (subscription: Omit<Subscription, 'id' | 'createdAt'>) => Promise<Subscription>;
    update: (
      userId: string,
      subscription: Partial<Omit<Subscription, 'id' | 'createdAt'>>
    ) => Promise<Subscription>;
    updateByCustomerId: (
      customerId: string,
      subscription: Partial<Omit<Subscription, 'id' | 'createdAt'>>
    ) => Promise<Subscription>;
    delete: (id: string) => Promise<void>;
  };
  abstract note: {
    findById: (id: string) => Promise<Note | null>;
    findByUserId: (userId: string) => Promise<Note[]>;
    create: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<Note>;
    update: (id: string, note: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<Note>;
    delete: (id: string) => Promise<void>;
    findMany: (args: {
      search?: string;
      userId: string;
      skip: number;
      take: number;
      orderBy: {
        createdAt?: 'desc' | 'asc';
        title?: 'asc';
      };
    }) => Promise<Note[]>;
    count: (userId: string, search?: string) => Promise<number>;
  };
  abstract portfolio: {
    findById: (id: string) => Promise<Portfolio | null>;
    findByUserId: (userId: string) => Promise<Portfolio[]>;
    create: (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Portfolio>;
    update: (id: string, portfolio: Partial<Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Portfolio>;
    delete: (id: string) => Promise<void>;
    count: (userId: string) => Promise<number>;
  };
  abstract holding: {
    findById: (id: string) => Promise<Holding | null>;
    findByPortfolioId: (portfolioId: string) => Promise<Holding[]>;
    findBySymbol: (portfolioId: string, symbol: string) => Promise<Holding | null>;
    create: (holding: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Holding>;
    update: (id: string, holding: Partial<Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Holding>;
    delete: (id: string) => Promise<void>;
    updatePrices: (updates: { symbol: string; price: number }[]) => Promise<void>;
  };
  abstract verificationToken: {
    create: (data: { identifier: string; token: string; expires: Date }) => Promise<void>;
    find: (
      identifier: string,
      token: string
    ) => Promise<{ identifier: string; token: string; expires: Date } | null>;
    findByToken: (
      token: string
    ) => Promise<{ identifier: string; token: string; expires: Date } | null>;
    delete: (identifier: string, token: string) => Promise<void>;
    deleteExpired: (now: Date) => Promise<void>;
  };
  abstract priceCache: {
    findBySymbol: (symbol: string) => Promise<PriceCache | null>;
    upsert: (data: Omit<PriceCache, 'id' | 'createdAt'>) => Promise<PriceCache>;
    deleteBySymbol: (symbol: string) => Promise<void>;
    deleteAll: () => Promise<void>;
  };
  abstract checkConnection(): Promise<boolean>;

  abstract checkConfiguration(): Promise<ServiceConfigStatus>;

  /**
   * Default implementation: database services are required by default.
   * Override this method if a specific database implementation should be optional.
   */
  isRequired(): boolean {
    return true;
  }
}
