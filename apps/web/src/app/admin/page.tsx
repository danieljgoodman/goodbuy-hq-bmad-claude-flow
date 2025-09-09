import { Metadata } from 'next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SuccessMetricsDashboard from '@/components/admin/SuccessMetricsDashboard'
import TestimonialManager from '@/components/admin/TestimonialManager'

export const metadata: Metadata = {
  title: 'Admin Dashboard - GoodBuy HQ',
  description: 'Platform analytics, success metrics, and testimonial management',
}

export default function AdminPage() {
  // Simplified admin page without authentication for development

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Platform analytics, user success metrics, and content management
          </p>
        </div>

        <Tabs defaultValue="success-metrics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="success-metrics">Success Metrics</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="success-metrics" className="space-y-4">
            <SuccessMetricsDashboard />
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-4">
            <TestimonialManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Advanced analytics dashboard coming soon...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}