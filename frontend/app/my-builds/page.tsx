'use client'

export default function MyBuilds() {
  const builds = [
    {
      title: "Budget Gaming PC",
      specs: ["Ryzen 5 3600", "GTX 1660 Super", "16GB RAM", "1TB SSD"],
      price: "$480",
      image: "https://via.placeholder.com/150",
      contact: "DM me on Instagram @yourhandle"
    },
    {
      title: "Streaming PC",
      specs: ["i7-8700", "RTX 3060", "32GB RAM", "2TB HDD + 1TB SSD"],
      price: "$650",
      image: "https://via.placeholder.com/150",
      contact: "Text me: 801-xxx-xxxx"
    }
  ]

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>💻 My PC Builds</h1>

      {builds.map((build, i) => (
        <div key={i} style={{ border: '1px solid #ccc', padding: 15, marginBottom: 20 }}>
          <img src={build.image} alt={build.title} style={{ width: 150, marginBottom: 10 }} />
          <h2>{build.title}</h2>
          <ul>
            {build.specs.map((spec, j) => <li key={j}>• {spec}</li>)}
          </ul>
          <p style={{ fontWeight: 'bold', marginTop: 10 }}>{build.price}</p>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>{build.contact}</p>
        </div>
      ))}
    </main>
  )
}
