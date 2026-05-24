# ⚽ CymorEdge — Football Analytics Like No Other

> Live odds · xG · Corners · H2H · Goal Scorers · Recent Form

---

## 🗂 Project Structure

```
cymoredge/
├── backend/               # Node.js + Express API
│   ├── routes/
│   │   ├── matches.js     # Match fixtures, stats, events, predictions
│   │   ├── teams.js       # Team search and form
│   │   ├── h2h.js         # Head to Head analysis
│   │   └── odds.js        # Live odds from bookmakers
│   ├── services/
│   │   ├── apiFootball.js # API-Football wrapper
│   │   └── oddsApi.js     # The Odds API wrapper
│   ├── middleware/
│   │   └── cache.js       # In-memory response caching
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── MatchCard.js
│   │   │   ├── OddsCard.js
│   │   │   ├── FormBadge.js
│   │   │   └── StatBar.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── MatchDay.js
│   │   │   ├── MatchDetail.js
│   │   │   ├── LiveOdds.js
│   │   │   ├── H2H.js
│   │   │   └── TeamForm.js
│   │   └── utils/api.js
│   ├── public/index.html
│   └── package.json
│
├── render.yaml            # Backend deployment (Render)
├── vercel.json            # Frontend deployment (Vercel)
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone from GitHub

```bash
git clone https://github.com/YOUR_USERNAME/cymoredge.git
cd cymoredge
```

### 2. Set up Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your API keys:
```env
API_FOOTBALL_KEY=your_key_here
FOOTBALL_DATA_KEY=your_key_here
ODDS_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
```

```bash
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Set up Frontend

```bash
cd ../frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api (already set)
npm install
npm start
# Frontend runs on http://localhost:3000
```

---

## 🔑 Getting API Keys (All Free)

### API-Football
1. Go to https://www.api-football.com
2. Sign up → Dashboard → My Account → API Key
3. Free plan: 100 requests/day

### Football-Data.org
1. Go to https://www.football-data.org/client/register
2. Confirm email → API token is in your profile
3. Free plan: 10 requests/minute

### The Odds API
1. Go to https://the-odds-api.com
2. Sign up for free → API Key on dashboard
3. Free plan: 500 requests/month

---

## 📤 Push to GitHub

```bash
# From the cymoredge root folder:

git init
git add .
git commit -m "🚀 Initial CymorEdge commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/cymoredge.git
git branch -M main
git push -u origin main
```

---

## ☁️ Deploy to Production

### Backend → Render (Free)

1. Go to https://render.com and sign up
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `API_FOOTBALL_KEY`
   - `FOOTBALL_DATA_KEY`
   - `ODDS_API_KEY`
   - `FRONTEND_URL` → your Vercel URL (add after frontend deploy)
6. Deploy → Copy your Render URL (e.g. `https://cymoredge-backend.onrender.com`)

### Frontend → Vercel (Free)

1. Go to https://vercel.com and sign up
2. Click **Add New → Project**
3. Import your GitHub repo
4. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Create React App
5. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://cymoredge-backend.onrender.com/api`
6. Deploy → your site is live! 🎉

---

## 🧩 Features

| Feature | Source |
|---|---|
| Live & today's matches | API-Football |
| Match stats (xG, corners, shots, possession) | API-Football |
| Goal scorers & match events | API-Football |
| AI match predictions | API-Football |
| Head to Head history | API-Football |
| Recent team form (W/D/L) | API-Football |
| Live odds from 40+ bookmakers | The Odds API |
| Best odds highlighting | Client-side |
| Auto-refresh (live data) | React intervals |
| Response caching | node-cache |

---

## 🛣 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/matches/today` | Today's fixtures |
| GET | `/api/matches/live` | Live matches |
| GET | `/api/matches/date/:date` | Fixtures by date |
| GET | `/api/matches/:id/stats` | Match statistics |
| GET | `/api/matches/:id/events` | Goals, cards, subs |
| GET | `/api/matches/:id/predictions` | AI prediction |
| GET | `/api/teams/search?name=` | Search teams |
| GET | `/api/teams/:id/form` | Team recent form |
| GET | `/api/h2h?team1=&team2=` | Head to head |
| GET | `/api/odds?league=` | Live odds |
| GET | `/api/odds/match?home=&away=` | Odds for a match |

---

## 🎨 Tech Stack

- **Frontend:** React 18, React Router, Recharts, Google Fonts (Bebas Neue, DM Sans, JetBrains Mono)
- **Backend:** Node.js, Express, Axios, node-cache, express-rate-limit
- **APIs:** API-Football, The Odds API
- **Deploy:** Vercel (frontend) + Render (backend)

---

Built with ❤️ — CymorEdge
