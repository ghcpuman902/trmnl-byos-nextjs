'use client'

import { useEffect, useState } from 'react'

interface TimeAgoProps {
  date: string | Date
}

export const TimeAgo = ({ date }: TimeAgoProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date().getTime()
      const past = new Date(date).getTime()
      const diffSeconds = Math.floor((now - past) / 1000)

      // Less than 5 seconds
      if (diffSeconds < 5) {
        return 'just now'
      }

      // 5-60 seconds
      if (diffSeconds < 60) {
        return `${diffSeconds}s ago`
      }

      // 1-59 minutes
      if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60)
        const seconds = diffSeconds % 60
        return `${minutes}m ${seconds}s ago`
      }

      // 1-71 hours
      if (diffSeconds < 259200) { // 72 hours in seconds
        const hours = Math.floor(diffSeconds / 3600)
        const minutes = Math.floor((diffSeconds % 3600) / 60)
        return `${hours}h ${minutes}m ago`
      }

      // More than 72 hours
      const days = Math.floor(diffSeconds / 86400) // 86400 seconds in a day
      return `${days} days ago`
    }

    // Initial calculation
    setTimeAgo(calculateTimeAgo())

    // Update every second
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo())
    }, 1000)

    return () => clearInterval(interval)
  }, [date])

  return (
    <span title={new Date(date).toLocaleString()} suppressHydrationWarning>
      {timeAgo}
    </span>
  )
} 