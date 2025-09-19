/**
 * Enterprise Exit Strategies API Route
 * GET /api/enterprise/exit-strategies - Exit strategy options
 */

import { NextRequest } from 'next/server';
import { getExitStrategies } from '@/lib/api/enterprise-dashboard';

export async function GET(req: NextRequest) {
  return getExitStrategies(req);
}