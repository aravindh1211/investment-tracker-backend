import { google, sheets_v4 } from 'googleapis';
import { config } from '../config';
import { Holding, IdealAllocation, MonthlyGrowth, Snapshot } from '../types';

export class SheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  
  // In-memory cache for ID to row mapping
  private holdingsRowMap: Map<string, number> = new Map();

  constructor() {
    const auth = new google.auth.JWT(
      config.googleClientEmail,
      undefined,
      config.googlePrivateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = config.googleSheetsSpreadsheetId;
  }

  /**
   * Initialize the holdings row map by reading all holdings
   */
  private async initializeHoldingsRowMap(): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'MF_STOCKS',
      });

      const rows = response.data.values || [];
      this.holdingsRowMap.clear();

      // Skip header row (index 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0]) { // If ID exists
          this.holdingsRowMap.set(row[0], i + 1); // +1 because sheets are 1-indexed
        }
      }
    } catch (error) {
      console.error('Error initializing holdings row map:', error);
      throw error;
    }
  }

  /**
   * Get all holdings from the MF_STOCKS named range
   */
  async getHoldings(): Promise<Holding[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'MF_STOCKS',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return []; // No data rows

      const holdings: Holding[] = [];
      
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0]) { // Check if ID exists
          holdings.push(this.parseHoldingFromRow(row));
          // Update row map
          this.holdingsRowMap.set(row[0], i + 1);
        }
      }

      return holdings;
    } catch (error) {
      console.error('Error fetching holdings:', error);
      throw error;
    }
  }

/**
 * Add a new holding
 */
async addHolding(holding: Omit<Holding, 'id' | 'updated_at' | 'value'>): Promise<Holding> {
  try {
    const id = this.generateUUID();
    const updatedAt = new Date().toISOString();
    const value = holding.qty * holding.current_price;
    
    const newHolding: Holding = {
      ...holding,
      id,
      value,
      updated_at: updatedAt,
    };

    const rowValues = this.holdingToRowValues(newHolding);

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'MF_STOCKS',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues],
      },
    });

    return newHolding;
  } catch (error) {
    console.error('Error adding holding:', error);
    throw error;
  }
}

  /**
   * Update an existing holding by ID
   */
  async updateHolding(id: string, updates: Partial<Omit<Holding, 'id'>>): Promise<Holding> {
    try {
      // Ensure we have the latest row mapping
      if (this.holdingsRowMap.size === 0) {
        await this.initializeHoldingsRowMap();
      }

      const rowIndex = this.holdingsRowMap.get(id);
      if (!rowIndex) {
        throw new Error(`Holding with ID ${id} not found`);
      }

      // Get current holding data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `MF_STOCKS!A${rowIndex}:L${rowIndex}`,
      });

      const currentRow = response.data.values?.[0];
      if (!currentRow) {
        throw new Error(`Holding with ID ${id} not found in row ${rowIndex}`);
      }

      const currentHolding = this.parseHoldingFromRow(currentRow);
      const updatedHolding: Holding = {
        ...currentHolding,
        ...updates,
        id, // Ensure ID doesn't change
        updated_at: new Date().toISOString(),
      };

      // Recalculate value if qty or current_price changed
      if (updates.qty !== undefined || updates.current_price !== undefined) {
        updatedHolding.value = updatedHolding.qty * updatedHolding.current_price;
      }

      const rowValues = this.holdingToRowValues(updatedHolding);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `MF_STOCKS!A${rowIndex}:L${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowValues],
        },
      });

      return updatedHolding;
    } catch (error) {
      console.error('Error updating holding:', error);
      throw error;
    }
  }

  /**
   * Delete a holding by ID
   */
  async deleteHolding(id: string): Promise<void> {
    try {
      // Ensure we have the latest row mapping
      if (this.holdingsRowMap.size === 0) {
        await this.initializeHoldingsRowMap();
      }

      const rowIndex = this.holdingsRowMap.get(id);
      if (!rowIndex) {
        throw new Error(`Holding with ID ${id} not found`);
      }

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: await this.getSheetIdByName('MF & Stocks'), // Assuming this is the sheet name
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed for API
                endIndex: rowIndex,
              },
            },
          }],
        },
      });

      // Remove from cache
      this.holdingsRowMap.delete(id);
    } catch (error) {
      console.error('Error deleting holding:', error);
      throw error;
    }
  }

  /**
   * Get ideal allocation
   */
  async getIdealAllocation(): Promise<IdealAllocation[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'IDEAL_ALLOCATION',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return [];

      const allocations: IdealAllocation[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[1]) {
          allocations.push({
            sector: row[0],
            target_pct: parseFloat(row[1]) || 0,
          });
        }
      }

      return allocations;
    } catch (error) {
      console.error('Error fetching ideal allocation:', error);
      throw error;
    }
  }

  /**
   * Get monthly growth data
   */
  async getMonthlyGrowth(): Promise<MonthlyGrowth[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'MONTHLY_GROWTH',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return [];

      const growthData: MonthlyGrowth[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[1] && row[2]) {
          growthData.push({
            month: row[0],
            account: row[1],
            pnl: parseFloat(row[2]) || 0,
          });
        }
      }

      return growthData.sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Error fetching monthly growth:', error);
      throw error;
    }
  }

  /**
   * Add monthly growth entry
   */
  async addMonthlyGrowth(entry: MonthlyGrowth): Promise<MonthlyGrowth> {
    try {
      const rowValues = [entry.month, entry.account, entry.pnl];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'MONTHLY_GROWTH',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowValues],
        },
      });

      return entry;
    } catch (error) {
      console.error('Error adding monthly growth:', error);
      throw error;
    }
  }

  /**
   * Create and save a snapshot
   */
  async createSnapshot(): Promise<Snapshot[]> {
    try {
      const [holdings, idealAllocations] = await Promise.all([
        this.getHoldings(),
        this.getIdealAllocation(),
      ]);

      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
      const sectorTotals = holdings.reduce((acc, h) => {
        acc[h.sector] = (acc[h.sector] || 0) + h.value;
        return acc;
      }, {} as Record<string, number>);

      const snapshots: Snapshot[] = [];
      const currentDate = new Date().toISOString().split('T')[0];

      for (const allocation of idealAllocations) {
        const actualValue = sectorTotals[allocation.sector] || 0;
        const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0;
        const variance = actualPct - allocation.target_pct;

        snapshots.push({
          date: currentDate,
          sector: allocation.sector,
          actual_pct: actualPct,
          target_pct: allocation.target_pct,
          variance,
          total_value: totalValue,
        });
      }

      // Save snapshots to sheet
      const rowsToAdd = snapshots.map(s => [
        s.date,
        s.sector,
        s.actual_pct,
        s.target_pct,
        s.variance,
        s.total_value,
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'SNAPSHOT',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rowsToAdd,
        },
      });

      return snapshots;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  /**
   * Get all snapshots
   */
  async getSnapshots(): Promise<Snapshot[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'SNAPSHOT',
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return [];

      const snapshots: Snapshot[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[1]) {
          snapshots.push({
            date: row[0],
            sector: row[1],
            actual_pct: parseFloat(row[2]) || 0,
            target_pct: parseFloat(row[3]) || 0,
            variance: parseFloat(row[4]) || 0,
            total_value: parseFloat(row[5]) || 0,
          });
        }
      }

      return snapshots.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      throw error;
    }
  }

  // Helper methods

  private parseHoldingFromRow(row: any[]): Holding {
    return {
      id: row[0] || '',
      symbol: row[1] || '',
      name: row[2] || '',
      sector: row[3] || '',
      qty: parseFloat(row[4]) || 0,
      avg_price: parseFloat(row[5]) || 0,
      current_price: parseFloat(row[6]) || 0,
      value: parseFloat(row[7]) || 0,
      rsi: row[8] ? parseFloat(row[8]) : undefined,
      allocation_pct: parseFloat(row[9]) || 0,
      notes: row[10] || '',
      updated_at: row[11] || new Date().toISOString(),
    };
  }

  private holdingToRowValues(holding: Holding): any[] {
    return [
      holding.id,
      holding.symbol,
      holding.name,
      holding.sector,
      holding.qty,
      holding.avg_price,
      holding.current_price,
      holding.value,
      holding.rsi || '',
      holding.allocation_pct,
      holding.notes || '',
      holding.updated_at,
    ];
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async getSheetIdByName(sheetName: string): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets?.find(s => s.properties?.title === sheetName);
      return sheet?.properties?.sheetId || 0;
    } catch (error) {
      console.error('Error getting sheet ID:', error);
      return 0;
    }
  }

}
