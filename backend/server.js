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

// === eBay Search Route (use PRODUCTION endpoint) ===
app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'gpu'

  const url = `https://svcs.ebay.com/services/search/FindingService/v1
    ?OPERATION-NAME=findItemsByKeywords
    &SERVICE-VERSION=1.0.0
    &SECURITY-APPNAME=${EBAY_APP_ID}
    &RESPONSE-DATA-FORMAT=JSON
    &REST-PAYLOAD=true
    &keywords=${encodeURIComponent(query)}
    &paginationInput.entriesPerPage=10`
    .replace(/\n/g, '').replace(/\s+/g, '')

  try {
    console.log("📡 eBay API URL:", url)
    const response = await fetch(url, {
      headers: {
        'X-EBAY-SOA-SECURITY-APPNAME': EBAY_APP_ID,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()
    const items = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || []

    const results = items.map((item) => ({
      title: item.title?.[0],
      price: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__,
      url: item.viewItemURL?.[0],
      image: item.galleryURL?.[0],
      source: 'eBay'
    }))

    res.json(results)
  } catch (err) {
    console.error('eBay API error:', err)
    res.status(500).json({ error: 'eBay API failed' })
  }
})

// === UTIL: Extract part names from listing text ===
function extractParts(text) {
  const commonParts = [
    "ryzen 5 3600", "gtx 1660 super", "gtx 1060", "rtx 3060", "i5 10400", "i7 8700",
    "16gb ram", "32gb ram", "1tb ssd", "512gb ssd", "2tb hdd", "case", "power supply", "psu"
  ]
  const found = []
  const lower = text.toLowerCase()
  for (const part of commonParts) {
    if (lower.includes(part)) found.push(part)
  }
  return found
}

// === UTIL: Fetch average price from /api/search ===
async function getAveragePrice(part) {
  try {
    const res = await fetch(`http://localhost:4000/api/search?q=${encodeURIComponent(part)}`)
    const data = await res.json()
    const prices = data
      .map(item => parseFloat(item.price.replace(/[^0-9.]/g, '')))
      .filter(p => !isNaN(p))
      .slice(0, 3)

    if (prices.length === 0) return null
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    return Math.round(avg)
  } catch {
    return null
  }
}

// === AI Deal Analyzer (live prices!) ===
app.post('/api/analyze', async (req, res) => {
  const { listingText, listedPrice } = req.body
  const parts = extractParts(listingText)

  const prices = {}
  for (const part of parts) {
    const avg = await getAveragePrice(part)
    if (avg !== null) prices[part] = avg
  }

  const prompt = `
A user submitted this PC listing:
"${listingText}"
They are asking $${listedPrice}.

Here are estimated used part prices:
${Object.entries(prices).map(([part, price]) => `- ${part}: $${price}`).join('\n')}

Estimate the value of the PC, determine if it's underpriced or overpriced, and respond in friendly language for a non-tech person.
  `

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    })

    const reply = aiResponse.choices[0].message.content
    res.json({ reply, usedPrices: prices })
  } catch (err) {
    console.error('OpenAI error:', err)
    res.status(500).json({ error: 'AI request failed' })
  }
})

app.listen(4000, () => {
  console.log('✅ Server running on http://localhost:4000')
})
