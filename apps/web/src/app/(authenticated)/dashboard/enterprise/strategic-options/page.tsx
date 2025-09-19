import { Metadata } from 'next';
import { StrategicOptionValuation } from '@/components/dashboard/enterprise';

export const metadata: Metadata = {
  title: 'Strategic Option Valuation | Enterprise Dashboard',
  description: 'Advanced option pricing models for strategic investment analysis',
};

export default function StrategicOptionsPage() {
  return (
    <div className="container mx-auto py-6">
      <StrategicOptionValuation />
    </div>
  );
}