import { withAuth } from 'lib/auth/withAuth';
import { getHolding } from './getHolding';
import { editHolding } from './editHolding';
import { deleteHolding } from './deleteHolding';

export const GET = withAuth(getHolding);

export const PATCH = withAuth(editHolding);

export const DELETE = withAuth(deleteHolding);