'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface IndustrySelectorProps {
  selectedIndustry: string
  selectedSector: string
  onIndustryChange: (industry: string, sector: string) => void
  disabled?: boolean
}

const INDUSTRY_SECTORS = {
  'Technology': ['Software', 'Hardware', 'SaaS', 'AI/ML', 'Cybersecurity', 'Fintech'],
  'Healthcare': ['Medical Devices', 'Pharmaceuticals', 'Healthcare Services', 'Digital Health', 'Biotechnology'],
  'Finance': ['Banking', 'Insurance', 'Investment Services', 'Real Estate Finance', 'Credit Services'],
  'Manufacturing': ['Industrial Equipment', 'Consumer Goods', 'Automotive', 'Aerospace', 'Chemicals'],
  'Retail': ['E-commerce', 'Fashion', 'Food & Beverage', 'Home & Garden', 'Specialty Retail'],
  'Consulting': ['Management Consulting', 'IT Consulting', 'Financial Advisory', 'HR Consulting', 'Strategy'],
  'Real Estate': ['Commercial', 'Residential', 'Property Management', 'Real Estate Investment', 'Construction'],
  'Education': ['Higher Education', 'K-12', 'Online Learning', 'Training & Development', 'Educational Technology']
}

export function IndustrySelector({ 
  selectedIndustry, 
  selectedSector, 
  onIndustryChange, 
  disabled = false 
}: IndustrySelectorProps) {
  const [tempIndustry, setTempIndustry] = useState(selectedIndustry)

  const handleIndustryChange = (industry: string) => {
    setTempIndustry(industry)
    // Auto-select first sector for the industry
    const firstSector = INDUSTRY_SECTORS[industry as keyof typeof INDUSTRY_SECTORS]?.[0] || ''
    onIndustryChange(industry, firstSector)
  }

  const handleSectorChange = (sector: string) => {
    onIndustryChange(tempIndustry, sector)
  }

  const availableSectors = INDUSTRY_SECTORS[tempIndustry as keyof typeof INDUSTRY_SECTORS] || []

  return (
    <div className="flex items-center gap-3">
      <div className="space-y-1">
        <Label htmlFor="industry" className="text-xs text-gray-600">Industry</Label>
        <Select 
          value={selectedIndustry} 
          onValueChange={handleIndustryChange}
          disabled={disabled}
        >
          <SelectTrigger id="industry" className="w-[140px]">
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(INDUSTRY_SECTORS).map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="sector" className="text-xs text-gray-600">Sector</Label>
        <Select 
          value={selectedSector} 
          onValueChange={handleSectorChange}
          disabled={disabled || !tempIndustry}
        >
          <SelectTrigger id="sector" className="w-[140px]">
            <SelectValue placeholder="Select sector" />
          </SelectTrigger>
          <SelectContent>
            {availableSectors.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}