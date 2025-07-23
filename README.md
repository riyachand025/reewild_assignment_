# EcoScan - Clothing Carbon Footprint Scanner

EcoScan is a full-stack web application that empowers users to understand the environmental impact of their clothing choices. Users can upload or capture images of clothing items, view their estimated carbon footprint, earn eco-reward points, and redeem offers based on their eco-savings.

---

## Features
- **Upload or capture clothing images** (file upload or camera)
- **Automatic clothing item recognition** (mocked for demo)
- **Carbon footprint calculation** for each item
- **Eco-reward points** based on total carbon savings
- **Redeemable offers** based on points

---

## Tech Stack
- **Frontend:** React (JavaScript, PWA-ready)
- **Backend:** Node.js, Express
- **Image Recognition:** Mocked (can be replaced with OpenAI Vision or other models)
- **Storage:** In-memory (no database required)
- **Testing:** Jest, Supertest (backend)

---

## Setup & Running

### 1. Backend
```bash
cd backend
npm install
npm start
```
- Runs on [http://localhost:5000](http://localhost:5000)

### 2. Frontend
```bash
cd frontend
npm install
npm start
```
- Runs on [http://localhost:3000](http://localhost:3000)
- Make sure the backend is running for full functionality.

### 3. Run Backend Tests
```bash
cd backend
npx jest
```

---

## API Endpoints

### `POST /analyze-image`
- **Body:** `multipart/form-data` with `image` field
- **Response:** `{ items: [{ name, carbonScore }] }`

### `POST /eco-score`
- **Body:** `{ items: ["T-shirt", "Jeans"] }`
- **Response:** `{ totalCarbon, points }`

### `GET /offers?points=15`
- **Response:** `{ offers: [{ id, name, points }] }`

---

## Carbon Score Assumptions
| Item      | Carbon Score (kg CO₂) |
|-----------|----------------------|
| T-shirt   | 5                    |
| Jeans     | 10                   |
| Jacket    | 15                   |
| Dress     | 8                    |
| Sweater   | 7                    |
| Shorts    | 4                    |
| Skirt     | 6                    |
| Shirt     | 5                    |
| Socks     | 1                    |
| Shoes     | 12                   |

- **Eco-reward points:** 1 point per 2kg CO₂ (rounded down)

---

## Enhancement Proposals

### 1. **Scalability**
- Move from in-memory to persistent storage (e.g., PostgreSQL, MongoDB)
- Use containerization (Docker) and orchestration (Kubernetes) for scaling
- Add caching (Redis) for frequent lookups
- Deploy behind a load balancer (NGINX, AWS ELB)

### 2. **Improved Carbon Scoring**
- Integrate with real image recognition APIs (OpenAI Vision, Google Vision)
- Use detailed lifecycle data (material, brand, age, usage)
- Allow user input for more accurate scoring

### 3. **User Experience Enhancements**
- Add sustainability comparisons (e.g., "Your score is better than 80% of users!")
- Show tips for reducing carbon footprint
- Gamify with badges, leaderboards, and streaks
- Mobile-first design and offline PWA support

### 4. **External Integrations**
- Connect to eco-friendly e-commerce APIs for real offers
- Integrate with carbon offset APIs (e.g., tree planting)
- Social sharing of eco-achievements

---

## License
MIT 