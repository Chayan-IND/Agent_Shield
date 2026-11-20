# AgentShield

Security layer that monitors AI agent transactions and decides APPROVED, BLOCKED or PAUSED using permissions and risk rules. Transactions are simulated; there is no real payment integration.

**Stack:** React + Vite, plain CSS, Node.js + Express, MongoDB Atlas (Mongoose).

## Risk rules (checked in order)
1. Unknown agent identity -> BLOCKED
2. Agent deactivated -> BLOCKED
3. Amount above spending limit -> BLOCKED
4. Recipient not in agent's trusted list -> PAUSED
5. Otherwise -> APPROVED

## Setup
```bash
# backend
cd backend
npm install
cp .env.example .env     # then paste your MongoDB Atlas URI in MONGO_URI
npm run dev

# frontend (new terminal)
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## API
- `GET /api/transactions/stats`
- `GET /api/agents` | `POST /api/agents` | `PATCH /api/agents/:id/limit` | `PATCH /api/agents/:id/toggle`
- `GET /api/transactions` | `POST /api/transactions`
