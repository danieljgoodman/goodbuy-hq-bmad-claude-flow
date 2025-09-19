/**
 * Enterprise Financial Projections API Route
 * GET /api/enterprise/projections - Financial projections
 */

import { NextRequest } from 'next/server';
import { getProjections } from '@/lib/api/enterprise-dashboard';

export async function GET(req: NextRequest) {
  return getProjections(req);
}