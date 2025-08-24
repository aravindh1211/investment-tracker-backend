# Investment Tracker Frontend

A modern Next.js 14 web application for tracking personal investment portfolios with Google Sheets integration.

## Features

- 🎨 Modern UI with shadcn/ui components
- 🌙 Dark/Light theme toggle (defaults to dark)
- 📊 Interactive charts with Recharts
- 📱 Responsive design with Tailwind CSS
- 🔄 Real-time data with SWR
- ✅ Form validation with React Hook Form + Zod
- 🚀 Optimistic UI updates
- 📈 Portfolio analytics and KPIs

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: SWR
- **Theme**: next-themes
- **Icons**: Lucide React
- **Deployment**: Vercel

## Pages Overview

- **`/summary`** - Portfolio overview with KPIs and charts
- **`/holdings`** - Investment holdings CRUD management
- **`/ideal-allocation`** - Target allocation vs actual
- **`/monthly-growth`** - Monthly P&L tracking
- **`/snapshots`** - Historical allocation snapshots

## Local Development Setup

### Prerequisites

1. **Node.js 18+** installed
2. **Backend service** running (see backend README)
3. **Environment variables** configured

### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd investment-tracker-frontend
npm install
```

### Step 2: Environment Configuration

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables in `.env.local`:

```bash
# Backend API Configuration
BACKEND_URL=http://localhost:3000
API_TOKEN=your-super-secret-api-token-here

# Next.js Configuration
NEXT_PUBLIC_APP_NAME="Investment Tracker"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

**Important**: The `API_TOKEN` must match the one configured in your backend service.

### Step 3: Run the Development Server

```bash
# Development mode with hot reload
npm run dev

# Open browser to http://localhost:3001
```

### Step 4: Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start

# Type check
npm run type-check
```

## Deployment to Vercel

### Step 1: Prepare Repository

1. **Push your code to GitHub**
2. **Ensure all dependencies are in package.json**

### Step 2: Deploy on Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up/login
2. **Import your GitHub repository**:
   - Click "New Project"
   - Select your frontend repository
   - Configure the project

3. **Configure Build Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Step 3: Set Environment Variables

In Vercel dashboard, go to your project settings and add environment variables:

```bash
BACKEND_URL=https://your-backend-app.onrender.com
API_TOKEN=your-super-secret-api-token-here
NEXT_PUBLIC_APP_NAME=Investment Tracker
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Important**: Replace `your-backend-app.onrender.com` with your actual backend URL from Render.

### Step 4: Deploy

- Vercel will automatically build and deploy your app
- You'll get a URL like: `https://your-app.vercel.app`
- Set up custom domain if desired

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── globals.css        # Global styles + Tailwind
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx          # Home page (redirects to summary)
│   ├── summary/           # Portfolio summary dashboard
│   ├── holdings/          # Holdings management
│   ├── ideal-allocation/  # Allocation targets
│   ├── monthly-growth/    # Monthly P&L tracking
│   └── snapshots/         # Historical snapshots
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── navigation.tsx    # Sidebar navigation
│   ├── theme-provider.tsx # Theme context
│   ├── theme-toggle.tsx  # Dark/light toggle
│   └── holding-dialog.tsx # Add/edit holding modal
├── lib/
│   ├── api-client.ts     # Backend API client
│   └── utils.ts          # Utility functions
├── types/
│   └── index.ts          # TypeScript interfaces
└── hooks/
    └── use-toast.ts      # Toast notification hook
```

## Key Features

### 1. Dashboard Summary (`/summary`)
- Portfolio KPIs (Net Worth, Invested, Gain/Loss, YTD Growth)
- Sector allocation pie chart (Actual vs Target)
- Monthly growth trend line chart
- Allocation analysis pivot table

### 2. Holdings Management (`/holdings`)
- Sortable, searchable data table
- Add/Edit/Delete holdings with validation
- Real-time P&L calculations
- Sector-based filtering

### 3. Ideal Allocation (`/ideal-allocation`)
- Target allocation by sector
- Actual vs Target bar chart
- Variance analysis

### 4. Monthly Growth (`/monthly-growth`)
- Monthly P&L entry form
- Historical growth trend charts
- YTD performance tracking

### 5. Snapshots (`/snapshots`)
- Historical allocation snapshots
- Timeline view
- "Take Snapshot" functionality

## API Integration

The frontend communicates with the backend through a centralized API client (`src/lib/api-client.ts`):

```typescript
import { apiClient } from '@/lib/api-client'

// Get all holdings
const holdings = await apiClient.getHoldings()

// Create new holding
const newHolding = await apiClient.createHolding(holdingData)

// Update existing holding
const updated = await apiClient.updateHolding(id, updates)
```

## Data Fetching Strategy

Uses **SWR** for efficient data fetching with:
- Automatic caching
- Background revalidation
- Optimistic updates
- Error handling

```typescript
import useSWR from 'swr'

const { data, error, isLoading, mutate } = useSWR(
  '/v1/holdings',
  () => apiClient.getHoldings()
)
```

## Form Validation

All forms use **React Hook Form** with **Zod** schema validation:

```typescript
const holdingSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  qty: z.number().positive('Quantity must be positive'),
  // ... other fields
})
```

## Styling Guidelines

- **Dark theme by default** (user can toggle)
- **Tailwind CSS** for all styling
- **shadcn/ui components** for consistency
- **Responsive design** (mobile-first approach)
- **Accessible components** with proper ARIA labels

## Performance Optimizations

- **Next.js 14 App Router** for optimal routing
- **SWR caching** reduces API calls
- **Optimistic updates** for better UX
- **Component lazy loading** where appropriate
- **Image optimization** with Next.js Image component

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BACKEND_URL` | Backend API base URL | Yes | `http://localhost:3000` |
| `API_TOKEN` | API authentication token | Yes | - |
| `NEXT_PUBLIC_APP_NAME` | Application name | No | `Investment Tracker` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | No | `1.0.0` |

## Troubleshooting

### Common Issues

1. **"Failed to load data" errors**:
   - Check that backend service is running
   - Verify `BACKEND_URL` and `API_TOKEN` are correct
   - Check browser network tab for API call errors

2. **Theme not persisting**:
   - Clear browser localStorage
   - Check if `next-themes` is properly configured

3. **Charts not rendering**:
   - Ensure data is being fetched correctly
   - Check browser console for Recharts errors
   - Verify chart data format matches expected structure

4. **Build errors on Vercel**:
   - Run `npm run build` locally to check for TypeScript errors
   - Ensure all dependencies are in `package.json`
   - Check Vercel build logs for specific errors

### Development Tips

1. **Hot Reload Issues**:
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

2. **Type Checking**:
   ```bash
   # Run TypeScript check
   npm run type-check
   ```

3. **Debugging API Calls**:
   - Use browser DevTools Network tab
   - Check SWR DevTools (install browser extension)
   - Add console.log in `api-client.ts` for debugging

## Browser Support

- **Chrome** 91+
- **Firefox** 90+
- **Safari** 14+
- **Edge** 91+

## Security Notes

- ⚠️ **Never commit `.env.local`** files to version control
- 🔐 **API tokens are server-side only** (not exposed to browser)
- 🛡️ **All API calls go through Next.js API routes** for security
- 🚦 **Rate limiting handled by backend**

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with proper TypeScript types
3. Test thoroughly in both light and dark themes
4. Ensure responsive design works on mobile
5. Submit a pull request with clear description

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:
- **Next.js/React**: Check [Next.js documentation](https://nextjs.org/docs)
- **Tailwind CSS**: Check [Tailwind documentation](https://tailwindcss.com/docs)
- **shadcn/ui**: Check [shadcn/ui documentation](https://ui.shadcn.com)
- **Vercel deployment**: Check [Vercel documentation](https://vercel.com/docs)
- **Application issues**: Check browser console and network tabs