import { withAuth } from 'lib/auth/withAuth';
import { updatePortfolioPrices } from './updatePortfolioPrices';

export const POST = withAuth(updatePortfolioPrices);
