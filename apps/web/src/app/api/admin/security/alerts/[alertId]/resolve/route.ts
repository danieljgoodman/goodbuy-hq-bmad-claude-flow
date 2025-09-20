import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SecurityAlertManager } from '@/lib/security/alerts';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has admin privileges
    const isAdmin = await checkAdminAccess(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { alertId } = params;
    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Resolve the alert
    const alertManager = SecurityAlertManager.getInstance();
    await alertManager.resolveAlert(alertId, userId);

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully'
    });

  } catch (error) {
    console.error('Alert resolution error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkAdminAccess(userId: string): Promise<boolean> {
  // TODO: Implement actual admin access check
  return true;
}