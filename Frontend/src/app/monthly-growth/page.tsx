"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, calculateGainLossColor, formatMonth } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Plus, RefreshCw, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { MonthlyGrowthForm } from '@/types'

const monthlyGrowthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  account: z.string().min(1, 'Account is required').max(50, 'Account name too long'),
  pnl: z.number(),
})

type FormData = z.infer<typeof monthlyGrowthSchema>

export default function MonthlyGrowthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: monthlyGrowth, error, isLoading, mutate } = useSWR(
    '/v1/monthly-growth',
    () => apiClient.getMonthlyGrowth()
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(monthlyGrowthSchema),
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  const onSubmit = async (data: FormData) => {
    try {
      const entry: MonthlyGrowthForm = {
        month: data.month,
        account: data.account,
        pnl: data.pnl,
      }
      
      await apiClient.createMonthlyGrowth(entry)
      await mutate()
      reset()
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add monthly growth:', error)
      alert('Failed to add entry. Please try again.')
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load monthly growth data</p>
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
          <p>Loading monthly growth data...</p>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const totalPnL = monthlyGrowth?.reduce((sum, item) => sum + item.pnl, 0) || 0
  const averageMonthlyPnL = monthlyGrowth?.length ? totalPnL / monthlyGrowth.length : 0
  const positiveMonths = monthlyGrowth?.filter(item => item.pnl > 0).length || 0
  const currentYear = new Date().getFullYear().toString()
  const ytdPnL = monthlyGrowth?.filter(item => item.month.startsWith(currentYear)).reduce((sum, item) => sum + item.pnl, 0) || 0

  // Prepare chart data with cumulative values
  const sortedData = monthlyGrowth?.sort((a, b) => a.month.localeCompare(b.month)) || []
  const chartData = sortedData.map((item, index) => ({
    month: item.month,
    pnl: item.pnl,
    cumulative: sortedData.slice(0, index + 1).reduce((sum, m) => sum + m.pnl, 0),
    account: item.account
  }))

  // Get last 12 months for trend
  const last12Months = chartData.slice(-12)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monthly Growth</h1>
          <p className="text-muted-foreground">Track monthly profit & loss performance</p>
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
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Monthly Growth Entry</CardTitle>
            <CardDescription>Record your monthly profit/loss performance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month (YYYY-MM) *</Label>
                  <Input
                    id="month"
                    {...register('month')}
                    placeholder="2024-01"
                    className={errors.month ? 'border-destructive' : ''}
                  />
                  {errors.month && (
                    <p className="text-sm text-destructive">{errors.month.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Account *</Label>
                  <Input
                    id="account"
                    {...register('account')}
                    placeholder="Main Portfolio"
                    className={errors.account ? 'border-destructive' : ''}
                  />
                  {errors.account && (
                    <p className="text-sm text-destructive">{errors.account.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pnl">P&L Amount *</Label>
                  <Input
                    id="pnl"
                    type="number"
                    step="0.01"
                    {...register('pnl', { valueAsNumber: true })}
                    placeholder="1500.00"
                    className={errors.pnl ? 'border-destructive' : ''}
                  />
                  {errors.pnl && (
                    <p className="text-sm text-destructive">{errors.pnl.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Entry'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateGainLossColor(totalPnL)}`}>
              {formatCurrency(totalPnL)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD P&L</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateGainLossColor(ytdPnL)}`}>
              {formatCurrency(ytdPnL)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateGainLossColor(averageMonthlyPnL)}`}>
              {formatCurrency(averageMonthlyPnL)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Months</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positiveMonths}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyGrowth?.length ? ((positiveMonths / monthlyGrowth.length) * 100).toFixed(0) : 0}% success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly P&L Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly P&L Trend</CardTitle>
            <CardDescription>Last 12 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last12Months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => formatMonth(value)}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    labelFormatter={(value) => formatMonth(value as string)}
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                  />
                  <Bar 
                    dataKey="pnl" 
                    fill={(entry: any) => entry.pnl >= 0 ? '#10B981' : '#EF4444'}
                    name="Monthly P&L"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Growth</CardTitle>
            <CardDescription>Total cumulative performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => formatMonth(value)}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    labelFormatter={(value) => formatMonth(value as string)}
                    formatter={(value: number) => [formatCurrency(value), 'Cumulative P&L']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Cumulative P&L"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance History</CardTitle>
          <CardDescription>Complete history of monthly profit & loss entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Monthly P&L</TableHead>
                  <TableHead className="text-right">Cumulative P&L</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.slice().reverse().map((entry, index) => (
                  <TableRow key={`${entry.month}-${entry.account}`}>
                    <TableCell className="font-mono">
                      {formatMonth(entry.month)}
                    </TableCell>
                    <TableCell>
                      {entry.account}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${calculateGainLossColor(entry.pnl)}`}>
                      {formatCurrency(entry.pnl)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${calculateGainLossColor(entry.cumulative)}`}>
                      {formatCurrency(entry.cumulative)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        entry.pnl >= 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {entry.pnl >= 0 ? 'Profit' : 'Loss'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {chartData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No monthly growth data found. Add your first entry to get started.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}