# BFHL API

A simple REST API for the BFHL task with a small web UI to test requests.

## Features

- `POST /bfhl` for Fibonacci, primes, LCM, HCF, or AI response
- `GET /health` for health check
- Static UI at `/` to test requests in the browser
- Input validation and clear error responses

## Tech

- Node.js + Express
- Gemini API for AI responses

## Setup

1. Install dependencies

```bash
cd /Users/akshaybajaj/Projects/bfhl-api
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

Update `.env`:

```
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

If your key doesn’t support that model, run:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"
```

and set `GEMINI_MODEL` to a model name from the list.

3. Start server

```bash
npm run dev
```

Open:
- UI: `http://localhost:3000/`
- Health: `http://localhost:3000/health`

## API Usage

### GET /health

Response:

```json
{
  "is_success": true,
  "official_email": "akshay0017.be23@chitkara.edu.in"
}
```

### POST /bfhl

Exactly one key is required: `fibonacci`, `prime`, `lcm`, `hcf`, `AI`.

Success response structure:

```json
{
  "is_success": true,
  "official_email": "akshay0017.be23@chitkara.edu.in",
  "data": "..."
}
```

Error response structure:

```json
{
  "is_success": false,
  "official_email": "akshay0017.be23@chitkara.edu.in",
  "error": "..."
}
```

#### Examples

```bash
curl -X POST http://localhost:3000/bfhl \
  -H 'Content-Type: application/json' \
  -d '{"fibonacci":7}'
```

```bash
curl -X POST http://localhost:3000/bfhl \
  -H 'Content-Type: application/json' \
  -d '{"prime":[2,4,7,9,11]}'
```

```bash
curl -X POST http://localhost:3000/bfhl \
  -H 'Content-Type: application/json' \
  -d '{"lcm":[12,18,24]}'
```

```bash
curl -X POST http://localhost:3000/bfhl \
  -H 'Content-Type: application/json' \
  -d '{"hcf":[24,36,60]}'
```

```bash
curl -X POST http://localhost:3000/bfhl \
  -H 'Content-Type: application/json' \
  -d '{"AI":"What is the capital city of Maharashtra?"}'
```

