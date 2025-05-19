import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === 1. Get eBay OAuth Token (Browse API) ===
let cachedToken = null;
let tokenExpiry = 0;

async function getEbayAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 1000 * 60 * 110; // 110 minutes

  return cachedToken;
}

// === 2. Search Route using Browse API ===
app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'gpu';

  try {
    const accessToken = await getEbayAccessToken();
    const eBayPCid= 175673;
    const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&category_ids=${eBayPCid}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
    });

    const data = await response.json();

    if (!data.itemSummaries) {
      return res.status(500).json({ error: 'No items found' });
    }

    // Filter by conditionId === "3000" (Used but functional), and valid price
    const filtered = data.itemSummaries
      .filter(item => item.conditionId === "3000" && item.price?.value)
      .sort((a, b) => parseFloat(a.price.value) - parseFloat(b.price.value))
      .slice(0, 10);

    const results = filtered.map(item => ({
      title: item.title,
      price: item.price.value,
      url: item.itemWebUrl,
      image: item.image?.imageUrl,
      source: 'eBay',
      condition: item.condition
    }));

    res.json(results);
  } catch (err) {
    console.error('eBay API error:', err);
    res.status(500).json({ error: 'eBay API request failed' });
  }
});


// === 3. Part Extractor ===
function extractParts(text) {
  const commonParts = [
    "ryzen 5 3600", "gtx 1660 super", "gtx 1060", "rtx 3060", "i5 10400", "i7 8700",
    "16gb ram", "32gb ram", "1tb ssd", "512gb ssd", "2tb hdd", "case", "power supply", "psu"
  ];
  const found = [];
  const lower = text.toLowerCase();
  for (const part of commonParts) {
    if (lower.includes(part)) found.push(part);
  }
  return found;
}

// === 4. Average eBay Price from Search Results ===
async function getAveragePrice(part) {
  try {
    const res = await fetch(`http://localhost:4000/api/search?q=${encodeURIComponent(part)}`);
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const prices = data
      .map(item => parseFloat(item.price))
      .filter(p => !isNaN(p))
      .slice(0, 3);

    if (prices.length === 0) return null;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Math.round(avg);
  } catch {
    return null;
  }
}


// === 5. AI Deal Analyzer ===
app.post('/api/analyze', async (req, res) => {
  const { listingText, listedPrice } = req.body;
  const parts = extractParts(listingText);

  const prices = {};
  for (const part of parts) {
    const avg = await getAveragePrice(part);
    if (avg !== null) prices[part] = avg;
  }

  const prompt = `
A user submitted this PC listing:
"${listingText}"
They are asking $${listedPrice}.

Here are estimated used part prices:
${Object.entries(prices).map(([part, price]) => `- ${part}: $${price}`).join('\n')}

Estimate the value of the PC, determine if it's underpriced or overpriced, and respond in friendly language for a non-tech person. Keep it short.
  `;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = aiResponse.choices[0].message.content;
    res.json({ reply, usedPrices: prices });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

app.listen(4000, () => {
  console.log('✅ Server running on http://localhost:4000');
});
