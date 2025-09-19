/**
 * Enterprise Capital Structure API Route
 * GET /api/enterprise/capital-structure - Capital structure data
 */

import { NextRequest } from 'next/server';
import { getCapitalStructure } from '@/lib/api/enterprise-dashboard';

export async function GET(req: NextRequest) {
  return getCapitalStructure(req);
}