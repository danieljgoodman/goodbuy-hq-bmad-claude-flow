/**
 * Enterprise Scenarios API Route
 * GET /api/enterprise/scenarios - Strategic scenarios
 * POST /api/enterprise/scenarios - Save scenario
 */

import { NextRequest } from 'next/server';
import { getScenarios, saveScenario } from '@/lib/api/enterprise-dashboard';

export async function GET(req: NextRequest) {
  return getScenarios(req);
}

export async function POST(req: NextRequest) {
  return saveScenario(req);
}