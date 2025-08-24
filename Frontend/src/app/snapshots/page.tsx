"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatPercent, calculateGainLossColor, formatDate, getSectorColor } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Camera, RefreshCw, Calendar, TrendingUp, History } from 'lucide-react'

export default function SnapshotsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false)

  const { data: snapshots, error, isLoading, mutate } = useSWR(
    '/v1/snapshots',
    () => apiClient.getSnapshots()
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  const handleTakeSnapshot = async () => {
    setIsTakingSnapshot(true)
    try {
      await apiClient.createSnapshot()
      await mutate()
    } catch (error) {
      console.error('Failed to create snapshot:', error)
      alert('Failed to create snapshot. Please try again.')
    }
    setIsTakingSnapshot(false)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load snapshots data</p>
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
          <p>Loading snapshots...</p>
        </div>
      </div>
    )
  }

  // Group snapshots by date
  const snapshotsByDate = snapshots?.reduce((acc, snapshot) => {
    if (!acc[snapshot.date]) {
      acc[snapshot.date] = []
    }
    acc[snapshot.date].push(snapshot)
    return acc
  }, {} as Record<string, typeof snapshots>) || {}

  const snapshotDates = Object.keys(snapshotsByDate).sort().reverse()
  const latestSnapshot = snapshotDates[0]
  const latestSnapshotData = latestSnapshot ? snapshotsByDate[latestSnapshot] : []

  // Calculate portfolio value over time
  const portfolioValueHistory = snapshotDates.reverse().map(date => {
    const daySnapshots = snapshotsByDate[date]
    const totalValue = daySnapshots?.[0]?.total_value || 0
    return {
      date,
      value: totalValue,
      formattedDate: formatDate(date)
    }
  })

  // Prepare sector allocation trend data (last 6 snapshots)
  const recentDates = snapshotDates.slice(-6)
  const sectorTrendData = recentDates.map(date => {
    const daySnapshots = snapshotsByDate[date]
    const data: any = { date: formatDate(date) }
    
    daySnapshots?.forEach(snapshot => {
      data[snapshot.sector] = snapshot.actual_pct
    })
    
    return data
  })

  // Get unique sectors for the trend chart
  const uniqueSectors = [...new Set(snapshots?.map(s => s.sector) || [])]

  // Calculate statistics
  const totalSnapshots = snapshotDates.length
  const averageVariance = latestSnapshotData.length > 0 
    ? latestSnapshotData.reduce((sum, s) => sum + Math.abs(s.variance), 0) / latestSnapshotData.length 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Snapshots</h1>
          <p className="text-muted-foreground">Historical allocation snapshots and portfolio tracking</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleTakeSnapshot}
            disabled={isTakingSnapshot}
          >
            <Camera className={`h-4 w-4 mr-2 ${isTakingSnapshot ? 'animate-pulse' : ''}`} />
            {isTakingSnapshot ? 'Taking...' : 'Take Snapshot'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Snapshots</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSnapshots}</div>
            <p className="text-xs text-muted-foreground">
              Allocation records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSnapshotData[0] ? formatCurrency(latestSnapshotData[0].total_value) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestSnapshot ? formatDate(latestSnapshot) : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Variance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateGainLossColor(-averageVariance)}`}>
              {averageVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              From target allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              if (portfolioValueHistory.length < 2) return <div className="text-2xl font-bold">N/A</div>
              
              const firstValue = portfolioValueHistory[0].value
              const lastValue = portfolioValueHistory[portfolioValueHistory.length - 1].value
              const growth = lastValue - firstValue
              const growthPct = firstValue > 0 ? (growth / firstValue) * 100 : 0
              
              return (
                <div>
                  <div className={`text-2xl font-bold ${calculateGainLossColor(growth)}`}>
                    {formatCurrency(growth)}
                  </div>
                  <p className={`text-xs ${calculateGainLossColor(growthPct)}`}>
                    {formatPercent(growthPct)}
                  </p>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Value Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value History</CardTitle>
            <CardDescription>Total portfolio value from snapshots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioValueHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    name="Portfolio Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation Trend</CardTitle>
            <CardDescription>How sector allocations changed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sectorTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Allocation %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {uniqueSectors.slice(0, 6).map((sector, index) => (
                    <Line 
                      key={sector}
                      type="monotone" 
                      dataKey={sector} 
                      stroke={getSectorColor(sector)} 
                      strokeWidth={2}
                      name={sector}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshots Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Snapshots Timeline</CardTitle>
          <CardDescription>Historical allocation snapshots organized by date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {snapshotDates.map(date => {
              const daySnapshots = snapshotsByDate[date]
              const totalValue = daySnapshots[0]?.total_value || 0
              const avgVariance = daySnapshots.reduce((sum, s) => sum + Math.abs(s.variance), 0) / daySnapshots.length

              return (
                <div key={date} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{formatDate(date)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Portfolio Value: {formatCurrency(totalValue)} • 
                        Avg Variance: {avgVariance.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sector</TableHead>
                          <TableHead className="text-right">Actual %</TableHead>
                          <TableHead className="text-right">Target %</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {daySnapshots.map((snapshot, index) => (
                          <TableRow key={`${snapshot.date}-${snapshot.sector}-${index}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getSectorColor(snapshot.sector) }}
                                />
                                {snapshot.sector}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {snapshot.actual_pct.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {snapshot.target_pct.toFixed(1)}%
                            </TableCell>
                            <TableCell className={`text-right font-mono ${calculateGainLossColor(snapshot.variance)}`}>
                              {formatPercent(snapshot.variance)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                Math.abs(snapshot.variance) <= 2
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : Math.abs(snapshot.variance) <= 5
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {Math.abs(snapshot.variance) <= 2 ? 'On Target' : 
                                 Math.abs(snapshot.variance) <= 5 ? 'Close' : 'Off Target'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )
            })}

            {snapshotDates.length === 0 && (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No snapshots found. Take your first snapshot to start tracking allocation history.
                </p>
                <Button onClick={handleTakeSnapshot} disabled={isTakingSnapshot}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take First Snapshot
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}