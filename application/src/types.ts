import { USER_ROLES } from 'lib/auth/roles';

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  image: string | null;

  role: UserRole;
  createdAt: Date;

  verificationToken?: string | null;
  emailVerified: boolean;
}

// Subscription type
export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus | null;
  plan: SubscriptionPlan | null;
  customerId: string | null;
  createdAt: Date;
}

// Note type
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

// Portfolio type
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: PortfolioType;
  createdAt: Date;
  updatedAt: Date;
}

// Holding type
export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  shares: number;
  costBasis: number;
  purchaseDate: Date;
  currentPrice: number | null;
  sector: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Price Cache type
export interface PriceCache {
  id: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: Date;
  createdAt: Date;
}

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PENDING';

export type SubscriptionPlan = 'FREE' | 'PRO';

export type PortfolioType = 'PERSONAL' | 'RETIREMENT' | 'TAXABLE' | 'OTHER';

export interface UserWithSubscriptions extends User {
  subscription: Subscription | null;
}

export enum SubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
}

export enum SubscriptionPlanEnum {
  FREE = 'FREE',
  PRO = 'PRO',
}
