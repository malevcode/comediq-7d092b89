"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Sample data - would come from API in real implementation
const data = [
  { date: "Mar 27", lpm: 1.5 },
  { date: "Mar 29", lpm: 2.8 },
  { date: "Apr 1", lpm: 3.2 },
  { date: "Apr 3", lpm: 2.5 },
  { date: "Apr 5", lpm: 3.8 },
  { date: "Apr 7", lpm: 3.5 },
]

export function PerformanceChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
          <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
            label={{ value: "Laughs/Min", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="lpm"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
