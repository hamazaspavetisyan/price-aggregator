# Cryptocurrency Price Tracker

A Node.js application that fetches cryptocurrency prices from CoinGecko API and stores them in MongoDB.

## Features

- Fetches top 5 cryptocurrencies by market cap
- Collects prices from top 3 exchanges for each cryptocurrency (USDT pairs)
- Calculates average prices across exchanges
- Stores minimal data with exchange metadata
- Scheduled execution every 30 seconds
- On-demand execution support
- Comprehensive error handling for data quality issues

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote instance)

## Installation

```bash
npm install
```

## Running Tests

```bash
npm test
```

## Development

### Code Quality

Run formatting and linting:

```bash
npm run good
```

This command will:
1. Format code using Prettier
2. Run ESLint to check for code quality issues

### Individual Commands

```bash
# Format code
npm run format

# Check formatting without modifying files
npm run format:check

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

## Configuration

The application uses the following configuration:

- **MongoDB URI**: Set via `MONGODB_URI` environment variable (default: `mongodb://localhost:27017`)
- **Schedule Interval**: Every 30 seconds (configurable in `app.js`)
- **Database Name**: `crypto_prices`
- **Collection Name**: `prices`

## Usage

### Start the application

```bash
npm start
```

The application will:
1. Connect to MongoDB
2. Start the REST API server on port 3000
3. Execute the price collection pipeline immediately
4. Schedule recurring executions every 30 seconds
5. Continue running until stopped (Ctrl+C)

## API Endpoints

### Get Latest Price

Retrieve the latest price data for a specific cryptocurrency symbol.

```
GET http://127.0.0.1:3000/api/prices/latest?symbol={SYMBOL}
```

**Query Parameters:**
- `symbol` (required): Cryptocurrency symbol (e.g., BTC, ETH, DOGE)

**Example Request:**
```bash
curl "http://127.0.0.1:3000/api/prices/latest?symbol=BTC"
```

**Example Response:**
```json
{
  "coinId": "bitcoin",
  "coinName": "Bitcoin",
  "symbol": "BTC",
  "averagePrice": 68500.50,
  "exchanges": [
    {
      "name": "Binance",
      "price": 68505.00,
      "volume": 150000000,
      "trustScore": "green"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Sync Prices

Manually trigger the price collection process for all tracked cryptocurrencies.

```
POST http://127.0.0.1:3000/api/prices/sync
```

**Example Request:**
```bash
curl -X POST "http://127.0.0.1:3000/api/prices/sync"
```

**Example Response:**
```json
{
  "message": "Price sync completed successfully"
}
```

### Programmatic usage

The application can also be triggered programmatically:

```javascript
const { Application } = require('./app.js');

const app = new Application();
await app.start();

// Trigger on-demand execution
await app.executeNow();

// Stop the application
await app.stop();
```

## Data Structure

Each price record stored in MongoDB contains:

```javascript
{
  coinId: "bitcoin",
  coinName: "Bitcoin",
  symbol: "BTC",
  averagePrice: 68500.50,
  exchanges: [
    {
      name: "Binance",
      price: 68505.00,
      volume: 150000000,
      trustScore: "green"
    },
    // ... up to 3 exchanges
  ],
  timestamp: ISODate("2024-01-15T10:30:00.000Z")
}
```

## Error Handling

The application handles the following data quality issues:

1. **Missing exchange data**: If no USDT tickers are available, stores record with `averagePrice: null` and error message
2. **API errors**: Logs errors and stores error information in the database
3. **Stale prices**: Filters out tickers with invalid or zero prices
4. **Trust scores**: Prioritizes exchanges by trust score (green > yellow > red) and volume
5. **Rate limiting**: Includes 500ms delay between API calls to avoid rate limits

## Architecture

- **CoinGeckoService**: Handles API interactions with CoinGecko
- **DatabaseService**: Manages MongoDB connections and operations
- **PricePipeline**: Orchestrates data collection and processing
- **Application**: Main application controller with scheduling

## CoinGecko API Endpoints Used

1. `/coins/markets` - Get top cryptocurrencies by market cap
2. `/coins/{id}/tickers` - Get exchange tickers for specific cryptocurrency

## Notes

- The application prioritizes exchanges with higher trust scores and trading volume
- Only USDT pairs are considered for price calculations
- Minimal data storage to support long-term dataset growth
- Exchange metadata is retained for transparency and data quality tracking
