# UsedPartPicker (Starter MVP)

This is a full-stack starter for UsedPartPicker:

## Structure

- `/frontend` – Next.js frontend (TypeScript)
- `/backend` – Express API + Python eBay scraper

## How to Run

1. **Backend**
```bash
cd backend
npm install express cors
node server.js
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Python scraper**
```bash
pip install requests beautifulsoup4
```

Open `http://localhost:3000` to search for PC parts from eBay.
