# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page Eventbrite analytics dashboard ("Moonlight Mantras") deployed on Vercel. The frontend fetches data via a serverless proxy that keeps the Eventbrite API token secret.

## Development

There is no build step. The project is plain HTML/JS/CSS with one serverless function.

**Local development with Vercel CLI:**
```bash
npm i -g vercel
vercel dev   # serves frontend + /api/attendees at http://localhost:3000
```

**Required environment variable** (set in Vercel dashboard or `.env.local` for local dev):
```
EVENTBRITE_TOKEN=<your_token>
```

**Deploy:**
```bash
vercel --prod
```

## Architecture

```
index.html          — All frontend: HTML, CSS, and JS in one file
api/attendees.js    — Vercel serverless function (Eventbrite API proxy)
vercel.json         — Function config + CORS headers (60s CDN cache)
```

### Data flow

`index.html` → `GET /api/attendees?...` → `api/attendees.js` → Eventbrite REST API

The proxy (`api/attendees.js`) supports three modes via the `type` query param:
- `type=event` → fetches event details (`/events/{id}/`)
- `type=series` → fetches child events (`/series/{id}/events/`)
- *(default)* → paginates attendees (`/events/{id}/attendees/`) using `continuation` tokens

The frontend (`index.html`) calls `fetchAll()` which loops through all pages until `pagination.continuation` is absent.

### Hardcoded IDs (top of `index.html` `<script>`)

| Constant | Value | Purpose |
|---|---|---|
| `SERIES_ID` | `******************` | Eventbrite event series |
| `CHILD_ID` | `**********` | Specific child event to display |
| `PROXY` | `/api/attendees` | Serverless proxy path |

To switch events, update `CHILD_ID` (and `SERIES_ID` if changing series).

### Frontend charts

Uses Chart.js 4.4.1 from CDN. Two charts rendered after data loads:
- `lineChart` — cumulative registrations over time (line)
- `donutChart` — ticket type breakdown (doughnut)
