import { Metadata } from 'next';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';

export const metadata: Metadata = {
  title: 'Security Dashboard | Admin',
  description: 'Real-time security monitoring and threat analysis dashboard',
};

export default function SecurityDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <SecurityDashboard />
    </div>
  );
}