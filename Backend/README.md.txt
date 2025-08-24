# Investment Tracker Backend

A Node.js Express backend service that integrates with Google Sheets to manage personal investment data.

## Features

- 🔐 Secure API with token authentication
- 📊 Google Sheets integration for data storage
- 🚀 CRUD operations for investment holdings
- 📈 Summary calculations and KPIs
- 🛡️ Rate limiting and security middleware
- 🏗️ TypeScript for type safety
- ✅ Input validation with Zod

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Google Sheets (via Google Sheets API)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **Deployment**: Render (free tier)

## Local Development Setup

### Prerequisites

1. **Node.js 18+** installed
2. **Google Cloud Service Account** with Sheets API access
3. **Google Sheet** with named ranges configured

### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd investment-tracker-backend
npm install
```

### Step 2: Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your environment variables in `.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# API Security - Generate a strong random token
API_TOKEN=your-super-secret-api-token-here

# Google Cloud Service Account
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----"

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your-google-sheet-id-here

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:3001
```

### Step 3: Google Cloud Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google Sheets API**:
   - Go to APIs & Services > Library
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create Service Account**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create
   - Click on the created service account
   - Go to "Keys" tab > "Add Key" > "Create new key"
   - Choose JSON format and download

4. **Extract Credentials**:
   ```bash
   # From the downloaded JSON file, extract:
   GOOGLE_CLIENT_EMAIL=<client_email from JSON>
   GOOGLE_PRIVATE_KEY="<private_key from JSON>" # Keep the \n characters
   ```

### Step 4: Google Sheets Setup

1. **Create a Google Sheet** with the following named ranges:

   **Sheet 1: "MF & Stocks"** (Named range: `MF_STOCKS`)
   ```
   | id | symbol | name | sector | qty | avg_price | current_price | value | rsi | allocation_pct | notes | updated_at |
   ```

   **Sheet 2: "Ideal Allocation"** (Named range: `IDEAL_ALLOCATION`)
   ```
   | sector | target_pct |
   ```

   **Sheet 3: "Monthly Growth"** (Named range: `MONTHLY_GROWTH`)
   ```
   | month | account | pnl |
   ```

   **Sheet 4: "Snapshot"** (Named range: `SNAPSHOT`)
   ```
   | date | sector | actual_pct | target_pct | variance | total_value |
   ```

2. **Create Named Ranges**:
   - Select the data range (including headers)
   - Go to Data > Named ranges
   - Create ranges: `MF_STOCKS`, `IDEAL_ALLOCATION`, `MONTHLY_GROWTH`, `SNAPSHOT`

3. **Share with Service Account**:
   - Share your Google Sheet with the service account email
   - Give "Editor" permissions

### Step 5: Run the Application

```bash
# Development mode with hot reload
npm run dev

# Build and run production
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

All endpoints require `x-api-key` header (except `/health`).

### Health Check
```bash
GET /health
```

### Holdings Management
```bash
GET /v1/holdings                 # Get all holdings
POST /v1/holdings                # Create new holding
PUT /v1/holdings/:id            # Update holding by ID  
DELETE /v1/holdings/:id         # Delete holding by ID
```

### Other Endpoints
```bash
GET /v1/ideal-allocation        # Get target allocations
GET /v1/monthly-growth         # Get monthly P&L data
POST /v1/monthly-growth        # Add monthly entry
POST /v1/snapshot              # Create allocation snapshot
GET /v1/snapshots              # Get all snapshots
GET /v1/summary                # Get calculated KPIs
```

## Example API Usage

### Create a New Holding

```bash
curl -X POST http://localhost:3000/v1/holdings \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-token" \
  -d '{
    "symbol": "AAPL",
    "name": "Apple Inc",
    "sector": "Technology",
    "qty": 10,
    "avg_price": 150.00,
    "current_price": 155.00,
    "allocation_pct": 15.5,
    "notes": "Large cap growth stock"
  }'
```

### Get Summary Data

```bash
curl -X GET http://localhost:3000/v1/summary \
  -H "x-api-key: your-api-token"
```

## Deployment to Render

### Step 1: Prepare for Deployment

1. **Push your code to GitHub**
2. **Set up build script** (already configured in package.json)

### Step 2: Deploy on Render

1. **Go to [Render.com](https://render.com)** and sign up
2. **Create New Web Service**:
   - Connect your GitHub repository
   - Choose the backend repository
3. **Configure Service**:
   - **Name**: `investment-tracker-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables

In Render dashboard, add all environment variables from your `.env` file:

```bash
NODE_ENV=production
PORT=10000  # Render assigns this automatically
API_TOKEN=your-super-secret-api-token-here
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_SPREADSHEET_ID=your-google-sheet-id-here
FRONTEND_URL=https://your-frontend-app.vercel.app
```

### Step 4: Deploy

- Click "Create Web Service"
- Render will automatically build and deploy your app
- You'll get a URL like: `https://investment-tracker-backend.onrender.com`

## Security Notes

- ⚠️ **Never commit `.env` files** to version control
- 🔐 **Use strong API tokens** (minimum 32 characters)
- 🛡️ **Whitelist only your frontend domain** in CORS
- 📝 **Only share Google Sheets with the service account** (not personal email)
- 🚦 **Rate limiting is enabled** (60 requests per 15 minutes)

## Troubleshooting

### Common Issues

1. **"Missing required environment variable"**:
   - Check all required env vars are set
   - Verify Google credentials are correct

2. **"Unable to parse range"**:
   - Ensure named ranges are created in Google Sheets
   - Check range names match exactly: `MF_STOCKS`, `IDEAL_ALLOCATION`, etc.

3. **"Authentication Error"**:
   - Verify service account has access to the sheet
   - Check private key format (should include `\n` characters)
   - Make sure Sheets API is enabled in Google Cloud

4. **Rate Limit Errors**:
   - Default limit is 60 requests per 15 minutes
   - Adjust `RATE_LIMIT_*` variables if needed

### Logs

Check application logs:
```bash
# Local development
npm run dev

# On Render
# Check logs in Render dashboard
```

## Support

For issues related to:
- **Google Sheets API**: Check [Google Sheets API documentation](https://developers.google.com/sheets/api)
- **Render deployment**: Check [Render documentation](https://render.com/docs)
- **Application issues**: Check the logs and error messages

## License

MIT License - see LICENSE file for details.