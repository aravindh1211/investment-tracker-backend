"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, calculateGainLossColor, getSectorColor } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react'

export default function SummaryPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { data: summary, error, isLoading, mutate } = useSWR(
    '/v1/summary',
    () => apiClient.getSummary()
  )

  const { data: holdings } = useSWR(
    '/v1/holdings',
    () => apiClient.getHoldings()
  )

  const { data: idealAllocations } = useSWR(
    '/v1/ideal-allocation',
    () => apiClient.getIdealAllocation()
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load summary data</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading portfolio summary...</p>
        </div>
      </div>
    )
  }

  // Prepare pie chart data for allocation
  const allocationData = holdings && idealAllocations ? 
    idealAllocations.map(ideal => {
      const sectorHoldings = holdings.filter(h => h.sector === ideal.sector)
      const actualValue = sectorHoldings.reduce((sum, h) => sum + h.value, 0)
      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
      const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0
      
      return {
        name: ideal.sector,
        actual: actualPct,
        target: ideal.target_pct,
        value: actualValue,
        color: getSectorColor(ideal.sector)
      }
    }) : []

  // Prepare line chart data for monthly growth
  const monthlyData = summary.monthly_trend.map((item, index) => ({
    month: item.month,
    pnl: item.pnl,
    cumulative: summary.monthly_trend.slice(0, index + 1).reduce((sum, m) => sum + m.pnl, 0)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Summary</h1>
          <p className="text-muted-foreground">Overview of your investment portfolio</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.current_net_worth)}</div>
            <p className="text-xs text-muted-foreground">
              Current portfolio value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_invested)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount invested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {summary.unrealized_gain_loss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateGainLossColor(summary.unrealized_gain_loss)}`}>
              {formatCurrency(summary.unrealized_gain_loss)}
            </div>
            <p className={`text-xs ${calculateGainLossColor(summary.unrealized_pct)}`}>
              {formatPercent(summary.unrealized_pct)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateGainLossColor(summary.ytd_growth)}`}>
              {formatCurrency(summary.ytd_growth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Year to date performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
            <CardDescription>Actual vs Target allocation by sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="actual"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Allocation']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth Trend</CardTitle>
            <CardDescription>Monthly P&L and cumulative growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Monthly P&L"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Cumulative"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pivot Table */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation Analysis</CardTitle>
          <CardDescription>Detailed breakdown by sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Sector</th>
                  <th className="text-right p-2">Holdings Count</th>
                  <th className="text-right p-2">Value</th>
                  <th className="text-right p-2">Actual %</th>
                  <th className="text-right p-2">Target %</th>
                  <th className="text-right p-2">Variance</th>
                </tr>
              </thead>
              <tbody>
                {allocationData.map((sector) => {
                  const holdingsCount = holdings?.filter(h => h.sector === sector.name).length || 0
                  const variance = sector.actual - sector.target
                  
                  return (
                    <tr key={sector.name} className="border-b">
                      <td className="p-2 font-medium">{sector.name}</td>
                      <td className="text-right p-2">{holdingsCount}</td>
                      <td className="text-right p-2">{formatCurrency(sector.value)}</td>
                      <td className="text-right p-2">{sector.actual.toFixed(1)}%</td>
                      <td className="text-right p-2">{sector.target.toFixed(1)}%</td>
                      <td className={`text-right p-2 ${calculateGainLossColor(variance)}`}>
                        {formatPercent(variance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}