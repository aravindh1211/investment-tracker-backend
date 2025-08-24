import { z } from 'zod';

// Holding validation schemas
export const createHoldingSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  sector: z.string().min(1, 'Sector is required').max(50, 'Sector too long'),
  qty: z.number().positive('Quantity must be positive'),
  avg_price: z.number().positive('Average price must be positive'),
  current_price: z.number().positive('Current price must be positive'),
  rsi: z.number().min(0).max(100).optional(),
  allocation_pct: z.number().min(0).max(100, 'Allocation percentage must be between 0 and 100'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const updateHoldingSchema = createHoldingSchema.partial();

// Monthly growth validation schema
export const monthlyGrowthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  account: z.string().min(1, 'Account is required').max(50, 'Account name too long'),
  pnl: z.number(),
});

// Ideal allocation validation schema
export const idealAllocationSchema = z.object({
  sector: z.string().min(1, 'Sector is required').max(50, 'Sector name too long'),
  target_pct: z.number().min(0).max(100, 'Target percentage must be between 0 and 100'),
});

// API parameter validation
export const holdingIdSchema = z.object({
  id: z.string().uuid('Invalid holding ID format'),
});

export type CreateHoldingRequest = z.infer<typeof createHoldingSchema>;
export type UpdateHoldingRequest = z.infer<typeof updateHoldingSchema>;
export type MonthlyGrowthRequest = z.infer<typeof monthlyGrowthSchema>;
export type IdealAllocationRequest = z.infer<typeof idealAllocationSchema>;
export type HoldingIdParams = z.infer<typeof holdingIdSchema>;