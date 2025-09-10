'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, TrendingUp, TrendingDown, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface Goal {
  id: string
  name: string
  description: string
  target: number
  current: number
  unit: string
  category: 'revenue' | 'valuation' | 'performance' | 'operational' | 'growth'
  deadline: Date
  priority: 'high' | 'medium' | 'low'
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved'
  milestones: Milestone[]
}

interface Milestone {
  id: string
  name: string
  target: number
  achieved: boolean
  achievedDate?: Date
}

interface GoalProgressIndicatorProps {
  goals: Goal[]
  title?: string
  showMilestones?: boolean
  layout?: 'cards' | 'list'
  onGoalClick?: (goal: Goal) => void
}

export function GoalProgressIndicator({
  goals,
  title = 'Goal Progress',
  showMilestones = true,
  layout = 'cards',
  onGoalClick
}: GoalProgressIndicatorProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Filter goals
  const filteredGoals = goals.filter(goal => 
    (filterCategory === 'all' || goal.category === filterCategory) &&
    (filterStatus === 'all' || goal.status === filterStatus)
  )

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'on_track':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'behind':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Calendar className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'on_track':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'behind':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === 'currency') {
      return `$${(value / 1000).toFixed(0)}K`
    }
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`
    }
    return `${value.toLocaleString()} ${unit}`
  }

  const getDaysRemaining = (deadline: Date) => {
    const now = new Date()
    const timeDiff = deadline.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const progressPercentage = getProgressPercentage(goal.current, goal.target)
    const daysRemaining = getDaysRemaining(goal.deadline)
    const achievedMilestones = goal.milestones.filter(m => m.achieved).length
    
    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${getStatusColor(goal.status)}`}
        onClick={() => onGoalClick?.(goal)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {getStatusIcon(goal.status)}
                {goal.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {goal.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityIcon(goal.priority)}
              <Badge variant={
                goal.priority === 'high' ? 'destructive' :
                goal.priority === 'medium' ? 'secondary' : 'outline'
              }>
                {goal.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress 
              value={progressPercentage}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{formatValue(goal.current, goal.unit)}</span>
              <span>{formatValue(goal.target, goal.unit)}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-600">Deadline: </span>
              <span className="font-medium">
                {goal.deadline.toLocaleDateString()}
              </span>
            </div>
            <div className={`font-medium ${
              daysRemaining < 0 ? 'text-red-600' :
              daysRemaining < 7 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` :
               daysRemaining === 0 ? 'Due today' :
               `${daysRemaining} days left`}
            </div>
          </div>

          {/* Milestones */}
          {showMilestones && goal.milestones.length > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Milestones</span>
                <span className="font-medium">
                  {achievedMilestones}/{goal.milestones.length}
                </span>
              </div>
              <div className="space-y-1">
                {goal.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between text-xs">
                    <span className={milestone.achieved ? 'text-green-600' : 'text-gray-600'}>
                      {milestone.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span>{formatValue(milestone.target, goal.unit)}</span>
                      {milestone.achieved ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <div className="h-3 w-3 border border-gray-300 rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const GoalListItem = ({ goal }: { goal: Goal }) => {
    const progressPercentage = getProgressPercentage(goal.current, goal.target)
    const daysRemaining = getDaysRemaining(goal.deadline)
    
    return (
      <Card 
        className="cursor-pointer transition-all duration-200 hover:shadow-sm"
        onClick={() => onGoalClick?.(goal)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {getStatusIcon(goal.status)}
              <div className="flex-1">
                <h4 className="font-medium">{goal.name}</h4>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Progress */}
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-1.5" />
              </div>

              {/* Current/Target */}
              <div className="text-right min-w-[100px]">
                <p className="text-sm font-medium">
                  {formatValue(goal.current, goal.unit)}
                </p>
                <p className="text-xs text-gray-600">
                  of {formatValue(goal.target, goal.unit)}
                </p>
              </div>

              {/* Timeline */}
              <div className="text-right min-w-[80px]">
                <p className={`text-sm font-medium ${
                  daysRemaining < 0 ? 'text-red-600' :
                  daysRemaining < 7 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {daysRemaining < 0 ? 'Overdue' :
                   daysRemaining === 0 ? 'Due today' :
                   `${daysRemaining}d left`}
                </p>
                <p className="text-xs text-gray-600">
                  {goal.deadline.toLocaleDateString()}
                </p>
              </div>

              {/* Priority */}
              <Badge variant={
                goal.priority === 'high' ? 'destructive' :
                goal.priority === 'medium' ? 'secondary' : 'outline'
              }>
                {goal.priority}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="valuation">Valuation</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="achieved">Achieved</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {['achieved', 'on_track', 'at_risk', 'behind'].map((status) => {
            const count = goals.filter(g => g.status === status).length
            const percentage = goals.length > 0 ? (count / goals.length) * 100 : 0
            
            return (
              <div key={status} className={`text-center p-3 rounded-lg border ${getStatusColor(status)}`}>
                <p className="text-xs capitalize">{status.replace('_', ' ')}</p>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs opacity-75">{percentage.toFixed(0)}%</p>
              </div>
            )
          })}
        </div>

        {/* Goals Display */}
        {layout === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => (
              <GoalListItem key={goal.id} goal={goal} />
            ))}
          </div>
        )}

        {filteredGoals.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              No goals match the current filters
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}