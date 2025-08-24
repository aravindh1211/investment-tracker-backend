"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Holding, CreateHoldingForm } from '@/types'

const holdingSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  sector: z.string().min(1, 'Sector is required').max(50, 'Sector too long'),
  qty: z.number().positive('Quantity must be positive'),
  avg_price: z.number().positive('Average price must be positive'),
  current_price: z.number().positive('Current price must be positive'),
  rsi: z.number().min(0).max(100).optional().or(z.literal('')),
  allocation_pct: z.number().min(0).max(100, 'Allocation percentage must be between 0 and 100'),
  notes: z.string().max(500, 'Notes too long').optional(),
})

type HoldingFormData = z.infer<typeof holdingSchema>

interface HoldingDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  editingHolding?: Holding | null
}

export function HoldingDialog({ isOpen, onClose, onSubmit, editingHolding }: HoldingDialogProps) {
  const isEditing = !!editingHolding

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
  })

  useEffect(() => {
    if (isOpen) {
      if (editingHolding) {
        reset({
          symbol: editingHolding.symbol,
          name: editingHolding.name,
          sector: editingHolding.sector,
          qty: editingHolding.qty,
          avg_price: editingHolding.avg_price,
          current_price: editingHolding.current_price,
          rsi: editingHolding.rsi || '',
          allocation_pct: editingHolding.allocation_pct,
          notes: editingHolding.notes || '',
        })
      } else {
        reset({
          symbol: '',
          name: '',
          sector: '',
          qty: 0,
          avg_price: 0,
          current_price: 0,
          rsi: '',
          allocation_pct: 0,
          notes: '',
        })
      }
    }
  }, [isOpen, editingHolding, reset])

  const onFormSubmit = async (data: HoldingFormData) => {
    try {
      const formData: CreateHoldingForm = {
        ...data,
        rsi: data.rsi === '' ? undefined : Number(data.rsi),
        notes: data.notes || undefined,
      }

      if (isEditing) {
        await apiClient.updateHolding(editingHolding.id, formData)
      } else {
        await apiClient.createHolding(formData)
      }

      onSubmit()
    } catch (error) {
      console.error('Failed to save holding:', error)
      alert('Failed to save holding. Please try again.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Holding' : 'Add New Holding'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the holding information below.' : 'Enter the details for your new investment holding.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                {...register('symbol')}
                placeholder="AAPL"
                className={errors.symbol ? 'border-destructive' : ''}
              />
              {errors.symbol && (
                <p className="text-sm text-destructive">{errors.symbol.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector *</Label>
              <Input
                id="sector"
                {...register('sector')}
                placeholder="Technology"
                className={errors.sector ? 'border-destructive' : ''}
              />
              {errors.sector && (
                <p className="text-sm text-destructive">{errors.sector.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Apple Inc"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity *</Label>
              <Input
                id="qty"
                type="number"
                step="any"
                {...register('qty', { valueAsNumber: true })}
                placeholder="100"
                className={errors.qty ? 'border-destructive' : ''}
              />
              {errors.qty && (
                <p className="text-sm text-destructive">{errors.qty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocation_pct">Allocation % *</Label>
              <Input
                id="allocation_pct"
                type="number"
                step="0.01"
                {...register('allocation_pct', { valueAsNumber: true })}
                placeholder="15.5"
                className={errors.allocation_pct ? 'border-destructive' : ''}
              />
              {errors.allocation_pct && (
                <p className="text-sm text-destructive">{errors.allocation_pct.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avg_price">Average Price *</Label>
              <Input
                id="avg_price"
                type="number"
                step="0.01"
                {...register('avg_price', { valueAsNumber: true })}
                placeholder="150.00"
                className={errors.avg_price ? 'border-destructive' : ''}
              />
              {errors.avg_price && (
                <p className="text-sm text-destructive">{errors.avg_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_price">Current Price *</Label>
              <Input
                id="current_price"
                type="number"
                step="0.01"
                {...register('current_price', { valueAsNumber: true })}
                placeholder="155.00"
                className={errors.current_price ? 'border-destructive' : ''}
              />
              {errors.current_price && (
                <p className="text-sm text-destructive">{errors.current_price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsi">RSI (optional)</Label>
            <Input
              id="rsi"
              type="number"
              step="0.01"
              {...register('rsi', { valueAsNumber: true })}
              placeholder="45.6"
              className={errors.rsi ? 'border-destructive' : ''}
            />
            {errors.rsi && (
              <p className="text-sm text-destructive">{errors.rsi.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this holding..."
              rows={3}
              className={errors.notes ? 'border-destructive' : ''}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'} Holding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}