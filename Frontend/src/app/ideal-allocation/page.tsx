"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPercent, calculateGainLossColor, getSectorColor } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RefreshCw, Target } from 'lucide-react'

export default function IdealAllocationPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: idealAllocations, error: allocError, isLoading: allocLoading, mutate: mutateAlloc } = useSWR(
    '/v1/ideal-allocation',
    () => apiClient.getIdealAllocation()
  )

  const { data: holdings, error: holdingsError, isLoading: holdingsLoading, mutate: mutateHoldings } = useSWR(
    '/v1/holdings',
    () => apiClient.getHoldings()
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([mutateAlloc(), mutateHoldings()])
    setIsRefreshing(false)
  }

  const error = allocError || holdingsError
  const isLoading = allocLoading || holdingsLoading

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load allocation data</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading allocation data...</p>
        </div>
      </div>
    )
  }

  // Calculate actual allocations
  const totalValue = holdings?.reduce((sum, h) => sum + h.value, 0) || 0
  const sectorTotals = holdings?.reduce((acc, h) => {
    acc[h.sector] = (acc[h.sector] || 0) + h.value
    return acc
  }, {} as Record<string, number>) || {}

  // Prepare chart data
  const chartData = idealAllocations?.map(ideal => {
    const actualValue = sectorTotals[ideal.sector] || 0
    const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0
    const variance = actualPct - ideal.target_pct

    return {
      sector: ideal.sector,
      target: ideal.target_pct,
      actual: actualPct,
      variance,
      color: getSectorColor(ideal.sector)
    }
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ideal Allocation</h1>
          <p className="text-muted-foreground">Target allocation vs actual portfolio breakdown</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sectors</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{idealAllocations?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Variance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const maxVariance = chartData.reduce((max, item) => 
                Math.abs(item.variance) > Math.abs(max.variance) ? item : max
              , chartData[0] || { variance: 0 })
              
              return (
                <div>
                  <div className={`text-2xl font-bold ${calculateGainLossColor(maxVariance.variance)}`}>
                    {formatPercent(Math.abs(maxVariance.variance))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {maxVariance.sector || 'N/A'}
                  </p>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Target Range</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const inRange = chartData.filter(item => Math.abs(item.variance) <= 2).length
              return (
                <div>
                  <div className="text-2xl font-bold">{inRange}</div>
                  <p className="text-xs text-muted-foreground">
                    Within ±2% target
                  </p>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Actual vs Target Allocation</CardTitle>
          <CardDescription>Compare your current allocation with target percentages by sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sector" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                />
                <Legend />
                <Bar dataKey="target" fill="#3B82F6" name="Target %" />
                <Bar dataKey="actual" fill="#10B981" name="Actual %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation Details</CardTitle>
          <CardDescription>Detailed breakdown of target vs actual allocation by sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Target %</TableHead>
                  <TableHead className="text-right">Actual %</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">Target Value</TableHead>
                  <TableHead className="text-right">Rebalance Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((row) => {
                  const currentValue = sectorTotals[row.sector] || 0
                  const targetValue = (row.target / 100) * totalValue
                  const rebalanceAmount = targetValue - currentValue
                  const isInRange = Math.abs(row.variance) <= 2

                  return (
                    <TableRow key={row.sector}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.sector}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.target.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.actual.toFixed(1)}%
                      </TableCell>
                      <TableCell className={`text-right font-mono ${calculateGainLossColor(row.variance)}`}>
                        {formatPercent(row.variance)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${currentValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${targetValue.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${calculateGainLossColor(rebalanceAmount)}`}>
                        {rebalanceAmount >= 0 ? '+' : ''}${rebalanceAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isInRange 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {isInRange ? 'On Target' : 'Rebalance'}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {chartData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No allocation targets found. Set up your ideal allocation in Google Sheets.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}