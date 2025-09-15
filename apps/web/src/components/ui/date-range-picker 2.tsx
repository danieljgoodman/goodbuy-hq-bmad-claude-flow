'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from 'lucide-react'
import { DateRange } from 'react-day-picker'

interface DatePickerWithRangeProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({ date, onDateChange }: DatePickerWithRangeProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString()
  }

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    if (onDateChange && !isNaN(newDate.getTime())) {
      onDateChange({
        from: newDate,
        to: date?.to
      })
    }
  }

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    if (onDateChange && !isNaN(newDate.getTime())) {
      onDateChange({
        from: date?.from,
        to: newDate
      })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[300px] justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {formatDate(date.from)} - {formatDate(date.to)}
              </>
            ) : (
              formatDate(date.from)
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div>
            <label htmlFor="from-date" className="text-sm font-medium">From</label>
            <Input
              id="from-date"
              type="date"
              value={date?.from ? date.from.toISOString().split('T')[0] : ''}
              onChange={handleFromDateChange}
            />
          </div>
          <div>
            <label htmlFor="to-date" className="text-sm font-medium">To</label>
            <Input
              id="to-date"
              type="date"
              value={date?.to ? date.to.toISOString().split('T')[0] : ''}
              onChange={handleToDateChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}