import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PremiumAccessService } from '@/lib/services/PremiumAccessService'
import PrioritySupport from '@/components/premium/support/PrioritySupport'

export const metadata: Metadata = {
  title: 'Priority Support - GoodBuy HQ',
  description: 'Get premium support with priority response times and dedicated assistance',
}

export default async function SupportPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/login')
  }

  const accessCheck = await PremiumAccessService.checkAIFeatureAccess(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {accessCheck.hasAccess ? 'Priority Support' : 'Support Center'}
          </h1>
          <p className="text-lg text-gray-600">
            {accessCheck.hasAccess 
              ? 'Get dedicated premium support with faster response times and personalized assistance'
              : 'Access support resources and contact our team for help'
            }
          </p>
        </div>

        <PrioritySupport />
      </div>
    </div>
  )
}