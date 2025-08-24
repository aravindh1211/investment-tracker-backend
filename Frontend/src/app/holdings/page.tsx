"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatPercent, calculateGainLossColor, formatDate } from '@/lib/utils'
import { HoldingDialog } from '@/components/holding-dialog'
import { Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Holding } from '@/types'

export default function HoldingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: holdings, error, isLoading, mutate } = useSWR(
    '/v1/holdings',
    () => apiClient.getHoldings()
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  const handleEdit = (holding: Holding) => {
    setEditingHolding(holding)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this holding?')) {
      try {
        await apiClient.deleteHolding(id)
        mutate()
      } catch (error) {
        console.error('Failed to delete holding:', error)
        alert('Failed to delete holding. Please try again.')
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingHolding(null)
  }

  const handleHoldingSubmit = async () => {
    await mutate()
    handleDialogClose()
  }

  // Filter holdings based on search term
  const filteredHoldings = holdings?.filter(holding =>
    holding.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holding.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holding.sector.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Calculate totals
  const totalInvested = filteredHoldings.reduce((sum, h) => sum + (h.qty * h.avg_price), 0)
  const totalValue = filteredHoldings.reduce((sum, h) => sum + h.value, 0)
  const totalGainLoss = totalValue - totalInvested

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load holdings data</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Holdings</h1>
          <p className="text-muted-foreground">Manage your investment positions</p>
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
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Holding
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredHoldings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className={`text-sm ${calculateGainLossColor(totalGainLoss)}`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Investment Positions</CardTitle>
              <CardDescription>All your current holdings and their performance</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search holdings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading holdings...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                    <TableHead className="text-right">Allocation %</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHoldings.map((holding) => {
                    const invested = holding.qty * holding.avg_price
                    const gainLoss = holding.value - invested
                    const gainLossPct = invested > 0 ? ((gainLoss / invested) * 100) : 0

                    return (
                      <TableRow key={holding.id}>
                        <TableCell className="font-mono font-semibold">
                          {holding.symbol}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {holding.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                            {holding.sector}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {holding.qty.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(holding.avg_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(holding.current_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(holding.value)}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${calculateGainLossColor(gainLoss)}`}>
                          {formatCurrency(gainLoss)}
                          <div className="text-xs">
                            {formatPercent(gainLossPct)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {holding.allocation_pct.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(holding)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(holding.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredHoldings.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No holdings match your search.' : 'No holdings found. Add your first holding to get started.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <HoldingDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleHoldingSubmit}
        editingHolding={editingHolding}
      />
    </div>
  )
}