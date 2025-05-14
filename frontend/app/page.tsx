'use client'

import { useState } from 'react'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  const [dealText, setDealText] = useState('')
  const [dealPrice, setDealPrice] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    const res = await fetch(`http://localhost:4000/api/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data)
  }

  const analyzeDeal = async () => {
    setLoading(true)
    setAnalysis('')
    try {
      const res = await fetch(`http://localhost:4000/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingText: dealText, listedPrice: dealPrice })
      })
      const data = await res.json()
      setAnalysis(data.reply)
    } catch (err) {
      console.error(err)
      setAnalysis('Something went wrong.')
    }
    setLoading(false)
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>UsedPartPicker</h1>

      {/* Search Section */}
      <input
        style={{ padding: 8, margin: 8, border: '1px solid #ccc' }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a GPU, CPU..."
      />
      <button onClick={search} style={{ padding: 10, backgroundColor: '#0070f3', color: 'white' }}>
        Search
      </button>

      <div style={{ marginTop: 20 }}>
        {results.map((item, i) => (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 10, border: '1px solid #eee', marginBottom: 10 }}>
            <img src={item.image} style={{ width: 100 }} alt={item.title} />
            <h3>{item.title}</h3>
            <p>${item.price}</p>
          </a>
        ))}
      </div>

      {/* AI Deal Analyzer Section */}
      <div style={{ marginTop: 50 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🧠 PC Deal Analyzer</h2>

        <textarea
          value={dealText}
          onChange={(e) => setDealText(e.target.value)}
          placeholder="Paste the PC listing or specs (e.g. Ryzen 5 3600, GTX 1660 Super)..."
          rows={4}
          style={{ width: '100%', padding: 10, marginTop: 10, border: '1px solid #ccc' }}
        />

        <input
          type="number"
          value={dealPrice}
          onChange={(e) => setDealPrice(e.target.value)}
          placeholder="Listed price ($)"
          style={{ padding: 8, marginTop: 10, width: '150px', display: 'block' }}
        />

        <button onClick={analyzeDeal} style={{ marginTop: 10, padding: 10, backgroundColor: '#00b894', color: 'white' }}>
          Analyze Deal
        </button>

        {loading && <p>Analyzing...</p>}

        {analysis && (
          <div style={{ marginTop: 20, padding: 15, background: '#f0f0f0', borderRadius: 6 }}>
            <h3>💬 AI Evaluation:</h3>
            <p>{analysis}</p>
          </div>
        )}
      </div>
    </main>
  )
}
