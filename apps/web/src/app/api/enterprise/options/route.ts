/**
 * Enterprise Strategic Options API Route
 * GET /api/enterprise/options - Strategic options
 */

import { NextRequest } from 'next/server';
import { getStrategicOptionsData } from '@/lib/api/enterprise-dashboard';

export async function GET(req: NextRequest) {
  return getStrategicOptionsData(req);
}