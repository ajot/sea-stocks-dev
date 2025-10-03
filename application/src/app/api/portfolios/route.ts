import { withAuth } from 'lib/auth/withAuth';
import { getAllPortfolios } from './getAllPortfolios';
import { createPortfolio } from './createPortfolio';

export const GET = withAuth(getAllPortfolios);

export const POST = withAuth(createPortfolio);