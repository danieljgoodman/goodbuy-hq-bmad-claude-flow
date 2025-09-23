'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarContent, AvatarFallback } from '@/components/ui/avatar'
import { User, Building, Mail, Phone, MapPin, Camera, Save, AlertCircle } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    industry: '',
    businessSize: '',
    location: '',
    bio: ''
  })

  // Update form data when user data loads
  useEffect(() => {
    if (isLoaded && user) {
      // Check both publicMetadata and unsafeMetadata for data
      const publicMeta = user.publicMetadata || {}
      const unsafeMeta = user.unsafeMetadata || {}

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: publicMeta.phone as string || publicMeta.businessPhone as string || unsafeMeta.businessPhone as string || '',
        businessName: publicMeta.businessName as string || unsafeMeta.businessName as string || '',
        industry: publicMeta.industry as string || unsafeMeta.industry as string || '',
        businessSize: publicMeta.businessSize as string || unsafeMeta.employeeCountRange as string || '',
        location: publicMeta.location as string ||
          (unsafeMeta.businessAddress ? `${unsafeMeta.businessAddress.city}, ${unsafeMeta.businessAddress.state}` : '') || '',
        bio: publicMeta.bio as string || publicMeta.businessDescription as string || ''
      })
    }
  }, [isLoaded, user])

  const handleSave = async () => {
    if (!user) return

    try {
      // Update user profile through API route
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          businessName: formData.businessName,
          industry: formData.industry,
          businessSize: formData.businessSize,
          location: formData.location,
          bio: formData.bio
        })
      })

      if (response.ok) {
        // Reload user data to reflect changes
        await user.reload()
        setIsEditing(false)
      } else {
        console.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  // Show loading state while user data is loading
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal and business information</p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={isEditing ? "bg-primary" : ""}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            'Edit Profile'
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Photo */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarFallback className="text-2xl">
                  {formData.firstName?.[0]?.toUpperCase() || ''}{formData.lastName?.[0]?.toUpperCase() || formData.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg mb-1">
                {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'User'}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {formData.businessName || formData.email}
              </p>
              {isEditing && (
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({...formData, industry: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="services">Professional Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Financial Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="businessSize">Business Size</Label>
                  <Select
                    value={formData.businessSize}
                    onValueChange={(value) => setFormData({...formData, businessSize: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={!isEditing}
                  placeholder="City, State"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Business Description</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Brief description of your business..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Account Active</p>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {user?.publicMetadata?.subscriptionTier === 'enterprise' ? 'Enterprise Plan' :
                     user?.publicMetadata?.subscriptionTier === 'premium' ? 'Premium Plan' :
                     'Free Plan'}
                  </p>
                  {(!user?.publicMetadata?.subscriptionTier || user?.publicMetadata?.subscriptionTier === 'free') && (
                    <Button variant="link" size="sm" className="p-0">
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">
                    Remember to save your changes before navigating away from this page.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}