'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import the content component to avoid SSR issues
const SubscriptionSuccessContent = dynamic(
  () => import('./page-content'),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Loading subscription details...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
);

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Processing...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we confirm your subscription...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}