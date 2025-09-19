/**
 * Enterprise Dashboard API Route
 * GET /api/enterprise/dashboard - Main dashboard data
 */

import { NextRequest } from 'next/server';
import { getDashboardData } from '@/lib/api/enterprise-dashboard';

export async function GET(req: NextRequest) {
  return getDashboardData(req);
}