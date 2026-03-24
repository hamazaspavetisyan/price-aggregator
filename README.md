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
2. Execute the price collection pipeline immediately
3. Schedule recurring executions every 30 seconds
4. Continue running until stopped (Ctrl+C)

### On-demand execution

The application can be triggered programmatically:

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
