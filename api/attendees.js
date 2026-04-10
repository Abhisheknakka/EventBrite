/**
 * Vercel Serverless Function — Eventbrite Proxy
 * -----------------------------------------------
 * Keeps your API token secret (stored in Vercel env vars, never in the browser).
 * Handles CORS so the dashboard can call this from any browser.
 *
 * Endpoint: GET /api/attendees?event_id=XXXX&continuation=TOKEN
 *
 * Set this env var in Vercel dashboard or .env.local:
 *   EVENTBRITE_TOKEN = <your_token>
 */

const BASE = 'https://www.eventbriteapi.com/v3';

export default async function handler(req, res) {
  // CORS headers — allow your Vercel frontend to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.EVENTBRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'EVENTBRITE_TOKEN env var not set' });
  }

  const { event_id, continuation, type } = req.query;

  if (!event_id) {
    return res.status(400).json({ error: 'event_id query param is required' });
  }

  try {
    let url;

    if (type === 'event') {
      // Fetch event details
      url = `${BASE}/events/${event_id}/`;
    } else if (type === 'series') {
      // Fetch child events from series
      url = `${BASE}/series/${event_id}/events/`;
    } else {
      // Default: fetch attendees
      const params = new URLSearchParams({ expand: 'profile,answers' });
      if (continuation) params.set('continuation', continuation);
      url = `${BASE}/events/${event_id}/attendees/?${params}`;
    }

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: text });
    }

    const data = await upstream.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
