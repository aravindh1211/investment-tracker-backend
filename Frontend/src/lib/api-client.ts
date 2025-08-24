import { 
  Holding, 
  IdealAllocation, 
  MonthlyGrowth, 
  Snapshot, 
  Summary,
  CreateHoldingForm,
  UpdateHoldingForm,
  MonthlyGrowthForm,
  ApiError 
} from '@/types'

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000'
const API_TOKEN = process.env.API_TOKEN || ''

class ApiClient {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_TOKEN,
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Network Error',
        message: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
      }))
      throw new Error(error.message || 'An error occurred')
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest('/health')
  }

  // Holdings API
  async getHoldings(): Promise<Holding[]> {
    return this.makeRequest('/v1/holdings')
  }

  async createHolding(holding: CreateHoldingForm): Promise<Holding> {
    return this.makeRequest('/v1/holdings', {
      method: 'POST',
      body: JSON.stringify(holding),
    })
  }

  async updateHolding(id: string, updates: UpdateHoldingForm): Promise<Holding> {
    return this.makeRequest(`/v1/holdings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteHolding(id: string): Promise<void> {
    return this.makeRequest(`/v1/holdings/${id}`, {
      method: 'DELETE',
    })
  }

  // Ideal Allocation API
  async getIdealAllocation(): Promise<IdealAllocation[]> {
    return this.makeRequest('/v1/ideal-allocation')
  }

  // Monthly Growth API
  async getMonthlyGrowth(): Promise<MonthlyGrowth[]> {
    return this.makeRequest('/v1/monthly-growth')
  }

  async createMonthlyGrowth(entry: MonthlyGrowthForm): Promise<MonthlyGrowth> {
    return this.makeRequest('/v1/monthly-growth', {
      method: 'POST',
      body: JSON.stringify(entry),
    })
  }

  // Snapshots API
  async getSnapshots(): Promise<Snapshot[]> {
    return this.makeRequest('/v1/snapshots')
  }

  async createSnapshot(): Promise<Snapshot[]> {
    return this.makeRequest('/v1/snapshot', {
      method: 'POST',
    })
  }

  // Summary API
  async getSummary(): Promise<Summary> {
    return this.makeRequest('/v1/summary')
  }
}

export const apiClient = new ApiClient()

// SWR fetcher function
export const fetcher = (url: string) => apiClient.makeRequest(url)