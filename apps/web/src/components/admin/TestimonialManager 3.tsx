'use client'

export default function TestimonialManager() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Testimonial Manager</h2>
        <p className="text-gray-600 mb-4">Manage customer testimonials and success stories</p>
        
        <div className="space-y-4">
          <div className="border p-4 rounded">
            <h3 className="font-medium">"GoodBuy HQ transformed our business valuation process"</h3>
            <p className="text-sm text-gray-500 mt-1">- John Smith, CEO at TechCorp</p>
            <div className="mt-2 flex gap-2">
              <button className="text-blue-600 text-sm">Edit</button>
              <button className="text-red-600 text-sm">Delete</button>
            </div>
          </div>
          
          <div className="border p-4 rounded">
            <h3 className="font-medium">"The AI analysis helped us identify M in value"</h3>
            <p className="text-sm text-gray-500 mt-1">- Sarah Johnson, CFO at RetailCo</p>
            <div className="mt-2 flex gap-2">
              <button className="text-blue-600 text-sm">Edit</button>
              <button className="text-red-600 text-sm">Delete</button>
            </div>
          </div>
        </div>
        
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add New Testimonial
        </button>
      </div>
    </div>
  )
}
