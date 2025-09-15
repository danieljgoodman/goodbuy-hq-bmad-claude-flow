import { Metadata } from 'next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SuccessMetricsDashboard from '@/components/admin/SuccessMetricsDashboard'
import TestimonialManager from '@/components/admin/TestimonialManager'
import UserManagement from '@/components/admin/UserManagement'
import AdminAnalytics from '@/components/admin/AdminAnalytics'
import AdminNotifications from '@/components/admin/AdminNotifications'

export const metadata: Metadata = {
  title: 'Admin Dashboard - GoodBuy HQ',
  description: 'Platform analytics, success metrics, and testimonial management',
}

export default function AdminPage() {
  // Simplified admin page without authentication for development

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Platform analytics, user success metrics, and content management
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="success-metrics">Success Metrics</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="legacy-analytics">Legacy</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="success-metrics" className="space-y-4">
            <SuccessMetricsDashboard />
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-4">
            <TestimonialManager />
          </TabsContent>

          <TabsContent value="legacy-analytics" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Original analytics placeholder - replaced by new Analytics tab
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}