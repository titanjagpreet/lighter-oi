# Lighter OI Aggregator

Aggregates total open interest across all Lighter markets via WebSocket, doubles the reported value (Lighter reports half), stores it in Redis (or in-memory fallback), and exposes it via a simple REST API.

## Features
- Connects to Lighter WS and reads market stats snapshot
- Sums open_interest for all markets, multiplies by 2, saves once, then disconnects
- Reconnects and refreshes every 15 minutes
- Serves the latest total from Redis/memory over HTTP

## Requirements
- Node.js 18+
- Optional: Upstash Redis credentials for persistence

## Environment Variables
Create a `.env` file (optional if you want in-memory only):

```
UPSTASH_REDIS_REST_URL=...        # optional; enables Redis persistence
UPSTASH_REDIS_REST_TOKEN=...      # optional; enables Redis persistence
PORT=3002                         # optional; API port (default 3000/3002)
WS_URL=wss://mainnet.zklighter.elliot.ai/ws   # optional; override WS URL
WS_CHANNEL=market_stats/all                   # optional; override channel
```

If `UPSTASH_*` are not provided, the service will store the last value in-memory.

## Install
```
npm install
```

## Run (server and worker together)
```
npm run start
```
This will start:
- Worker: connects to WS, computes and saves doubled total, disconnects, repeats every 15 minutes
- Server: exposes the REST endpoint

## API
- GET `/api/open-interest`

Response:
```
{ "total_open_interest_usd": 848123456.78 }
```
Value is already multiplied by 2 as per Lighter’s reporting.

## Notes
- Logs are minimal: only the final doubled total is printed per refresh.
- The worker saves immediately on the initial snapshot, adapting to listings/delistings automatically.
