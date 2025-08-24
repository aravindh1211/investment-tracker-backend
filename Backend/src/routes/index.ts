import { Router, Request, Response } from 'express';
import { SheetsService } from '../services/sheetsService';
import {
  createHoldingSchema,
  updateHoldingSchema,
  monthlyGrowthSchema,
  holdingIdSchema,
  CreateHoldingRequest,
  UpdateHoldingRequest,
  MonthlyGrowthRequest,
  HoldingIdParams,
} from '../validation/schemas';
import { Summary } from '../types';

const router = Router();
const sheetsService = new SheetsService();

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get all holdings
 */
router.get('/v1/holdings', async (req: Request, res: Response, next) => {
  try {
    const holdings = await sheetsService.getHoldings();
    res.json(holdings);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new holding
 */
router.post('/v1/holdings', async (req: Request, res: Response, next) => {
  try {
    const validatedData = createHoldingSchema.parse(req.body);
    const holding = await sheetsService.addHolding(validatedData);
    res.status(201).json(holding);
  } catch (error) {
    next(error);
  }
});

/**
 * Update a holding by ID
 */
router.put('/v1/holdings/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = holdingIdSchema.parse(req.params);
    const validatedData = updateHoldingSchema.parse(req.body);
    const holding = await sheetsService.updateHolding(id, validatedData);
    res.json(holding);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a holding by ID
 */
router.delete('/v1/holdings/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = holdingIdSchema.parse(req.params);
    await sheetsService.deleteHolding(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * Get ideal allocation
 */
router.get('/v1/ideal-allocation', async (req: Request, res: Response, next) => {
  try {
    const allocation = await sheetsService.getIdealAllocation();
    res.json(allocation);
  } catch (error) {
    next(error);
  }
});

/**
 * Get monthly growth data
 */
router.get('/v1/monthly-growth', async (req: Request, res: Response, next) => {
  try {
    const growthData = await sheetsService.getMonthlyGrowth();
    res.json(growthData);
  } catch (error) {
    next(error);
  }
});

/**
 * Add monthly growth entry
 */
router.post('/v1/monthly-growth', async (req: Request, res: Response, next) => {
  try {
    const validatedData = monthlyGrowthSchema.parse(req.body);
    const entry = await sheetsService.addMonthlyGrowth(validatedData);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a snapshot
 */
router.post('/v1/snapshot', async (req: Request, res: Response, next) => {
  try {
    const snapshots = await sheetsService.createSnapshot();
    res.status(201).json(snapshots);
  } catch (error) {
    next(error);
  }
});

/**
 * Get all snapshots
 */
router.get('/v1/snapshots', async (req: Request, res: Response, next) => {
  try {
    const snapshots = await sheetsService.getSnapshots();
    res.json(snapshots);
  } catch (error) {
    next(error);
  }
});

/**
 * Get summary/KPI data
 */
router.get('/v1/summary', async (req: Request, res: Response, next) => {
  try {
    const [holdings, idealAllocations, monthlyGrowth] = await Promise.all([
      sheetsService.getHoldings(),
      sheetsService.getIdealAllocation(),
      sheetsService.getMonthlyGrowth(),
    ]);

    // Calculate KPIs
    const totalInvested = holdings.reduce((sum, h) => sum + (h.qty * h.avg_price), 0);
    const currentNetWorth = holdings.reduce((sum, h) => sum + h.value, 0);
    const unrealizedGainLoss = currentNetWorth - totalInvested;
    const unrealizedPct = totalInvested > 0 ? (unrealizedGainLoss / totalInvested) * 100 : 0;

    // Calculate allocation variance
    const sectorTotals = holdings.reduce((acc, h) => {
      acc[h.sector] = (acc[h.sector] || 0) + h.value;
      return acc;
    }, {} as Record<string, number>);

    const allocationVariance: Record<string, number> = {};
    idealAllocations.forEach(ideal => {
      const actualValue = sectorTotals[ideal.sector] || 0;
      const actualPct = currentNetWorth > 0 ? (actualValue / currentNetWorth) * 100 : 0;
      allocationVariance[ideal.sector] = actualPct - ideal.target_pct;
    });

    // Calculate YTD growth
    const currentYear = new Date().getFullYear().toString();
    const ytdEntries = monthlyGrowth.filter(entry => entry.month.startsWith(currentYear));
    const ytdGrowth = ytdEntries.reduce((sum, entry) => sum + entry.pnl, 0);

    // Get recent monthly trend (last 12 months)
    const sortedGrowth = monthlyGrowth
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12)
      .reverse();

    const summary: Summary = {
      total_invested: totalInvested,
      current_net_worth: currentNetWorth,
      unrealized_gain_loss: unrealizedGainLoss,
      unrealized_pct: unrealizedPct,
      allocation_variance: allocationVariance,
      monthly_trend: sortedGrowth,
      ytd_growth: ytdGrowth,
    };

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;