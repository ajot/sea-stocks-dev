import { withAuth } from 'lib/auth/withAuth';
import { getHoldings } from './getHoldings';
import { createHolding } from './createHolding';

export const GET = withAuth(getHoldings);

export const POST = withAuth(createHolding);