import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import OpenAI from 'openai'


const app = express()
app.use(cors())
app.use(express.json())

const EBAY_APP_ID = process.env.EBAY_APP_ID

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })


// === eBay Search Route ===
app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'gpu';

  const url = `https://svcs.sandbox.ebay.com/services/search/FindingService/v1
    ?OPERATION-NAME=findItemsByKeywords
    &SERVICE-VERSION=1.0.0
    &SECURITY-APPNAME=${EBAY_APP_ID}
    &RESPONSE-DATA-FORMAT=JSON
    &REST-PAYLOAD=true
    &keywords=${encodeURIComponent(query)}
    &paginationInput.entriesPerPage=10`
    .replace(/\n/g, '').replace(/\s+/g, '');

  try {
    const response = await fetch(url, {
      headers: {
        'X-EBAY-SOA-SECURITY-APPNAME': EBAY_APP_ID,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    const items = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];

    const results = items.map((item) => ({
      title: item.title?.[0],
      price: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__,
      url: item.viewItemURL?.[0],
      image: item.galleryURL?.[0],
      source: 'eBay'
    }));

    res.json(results);
  } catch (err) {
    console.error('eBay API error:', err);
    res.status(500).json({ error: 'eBay API failed' })
  }
})

// === AI Deal Analyzer Route ===

const prices = {
  "ryzen 5 3600": 70,
  "gtx 1660 super": 110,
  "16gb ram": 30,
  "1tb ssd": 35,
  "case + psu": 60
}

const scores = {
  "ryzen 5 3600": 14000,
  "gtx 1660 super": 11000
}

app.post('/api/analyze', async (req, res) => {
  const { listingText, listedPrice } = req.body

  const prompt = `
A user submitted this PC listing:
"${listingText}"
They are asking $${listedPrice}.

Here are estimated used part prices:
${Object.entries(prices).map(([part, price]) => `- ${part}: $${price}`).join('\n')}

Here are estimated performance scores (higher is better):
${Object.entries(scores).map(([part, score]) => `- ${part}: ${score}`).join('\n')}

Estimate the value of the PC, determine if it's underpriced or overpriced, and respond in friendly language for a non-tech person.
  `

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    })

    const reply = aiResponse.choices[0].message.content
    res.json({ reply })
  } catch (err) {
    console.error('OpenAI error:', err)
    res.status(500).json({ error: 'AI request failed' })
  }
})
app.listen(4000, () => {
  console.log('✅ Server running on http://localhost:4000')
})

