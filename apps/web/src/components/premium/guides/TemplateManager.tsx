'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Search, 
  Filter,
  Clock,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface Template {
  id: string
  name: string
  type: string
  category: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  industry: string[]
  tags: string[]
  variables: any[]
  instructions: string
  downloadCount: number
  createdAt: string
}

interface TemplateManagerProps {
  userId: string
}

export function TemplateManager({ userId }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [downloadingTemplate, setDownloadingTemplate] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, selectedCategory, selectedDifficulty])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load templates')
      }

      setTemplates(data.templates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates'
      setError(errorMessage)
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty)
    }

    setFilteredTemplates(filtered)
  }

  const downloadTemplate = async (templateId: string) => {
    try {
      setDownloadingTemplate(templateId)
      
      const response = await fetch(`/api/templates/${templateId}/download?userId=${userId}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required to download templates')
        }
        throw new Error(data.error || 'Failed to download template')
      }

      // Create a blob and download the template
      const blob = new Blob([JSON.stringify(data.template, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.template.name.replace(/\s+/g, '_')}_template.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download template'
      setError(errorMessage)
      console.error('Error downloading template:', err)
    } finally {
      setDownloadingTemplate(null)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const categories = Array.from(new Set(templates.map(t => t.category)))
  const difficulties = ['Beginner', 'Intermediate', 'Advanced']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Template Library</span>
          </CardTitle>
          <CardDescription>
            Download professional templates to accelerate your business improvements
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={selectedDifficulty}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Levels</option>
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <Badge className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{template.category}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{template.downloadCount} downloads</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Industries: {template.industry.slice(0, 2).join(', ')}
                  {template.industry.length > 2 && ` +${template.industry.length - 2} more`}
                </div>

                <Button
                  onClick={() => downloadTemplate(template.id)}
                  disabled={downloadingTemplate === template.id}
                  className="w-full"
                >
                  {downloadingTemplate === template.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory || selectedDifficulty
                ? 'Try adjusting your filters to see more templates.'
                : 'Templates are being loaded. Please try again later.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TemplateManager