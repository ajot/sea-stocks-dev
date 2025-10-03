import { withAuth } from 'lib/auth/withAuth';
import { getPortfolio } from './getPortfolio';
import { editPortfolio } from './editPortfolio';
import { deletePortfolio } from './deletePortfolio';

export const GET = withAuth(getPortfolio);

export const PATCH = withAuth(editPortfolio);

export const DELETE = withAuth(deletePortfolio);