import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import fs from "fs";
import path from "path";
import axios from "axios";

function loadEnvFromFile() {
  if (process.env.OPENAI_API_KEY) return;
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFromFile();

const app = express();
const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL = "akshay0017.be23@chitkara.edu.in";

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

const ALLOWED_KEYS = new Set(["fibonacci", "prime", "lcm", "hcf", "AI"]);

function badRequest(res, message) {
  return res.status(400).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: message,
  });
}

function isInt(n) {
  return Number.isInteger(n) && Number.isFinite(n);
}

function fibonacciSeries(n) {
  const result = [];
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i += 1) {
    result.push(a);
    const next = a + b;
    a = b;
    b = next;
  }
  return result;
}

function isPrime(n) {
  if (!isInt(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const limit = Math.floor(Math.sqrt(n));
  for (let i = 3; i <= limit; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / gcd(a, b)) * b);
}

async function getAiAnswer(question) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) {
    const err = new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not configured");
    err.status = 500;
    throw err;
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const geminiRes = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Answer in ONE WORD only.\nQuestion: ${question}`,
              },
            ],
          },
        ],
      },
      {
        params: { key: geminiKey },
        headers: { "Content-Type": "application/json" },
        timeout: 12000,
      },
    );

    const content =
      geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!content) {
      const err = new Error("Empty AI response");
      err.status = 502;
      throw err;
    }

    const singleWord = content.split(/\s+/)[0];
    return singleWord.replace(/[^\w-]/g, "");
  } catch (err) {
    // 👇 THIS IS THE KEY PART
    console.error("Gemini API error:", err.response?.data || err.message);

    const error = new Error(
      err.response?.data?.error?.message || "AI request failed",
    );
    error.status = err.response?.status || 500;
    throw error;
  }
}

app.get("/health", (req, res) => {
  res.json({ is_success: true, official_email: OFFICIAL_EMAIL });
});

app.post("/bfhl", async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest(res, "Request body must be a JSON object");
    }

    const keys = Object.keys(body);
    if (keys.length !== 1) {
      return badRequest(res, "Exactly one key is required");
    }

    const key = keys[0];
    if (!ALLOWED_KEYS.has(key)) {
      return badRequest(res, "Invalid key");
    }

    let data;

    if (key === "fibonacci") {
      const n = body.fibonacci;
      if (!isInt(n) || n < 0 || n > 10000) {
        return badRequest(res, "fibonacci must be an integer between 0 and 10000");
      }
      data = fibonacciSeries(n);
    }

    if (key === "prime") {
      const arr = body.prime;
      if (!Array.isArray(arr) || arr.length === 0 || arr.length > 1000) {
        return badRequest(res, "prime must be a non-empty array of integers");
      }
      if (!arr.every(isInt)) {
        return badRequest(res, "prime must contain only integers");
      }
      data = arr.filter(isPrime);
    }

    if (key === "lcm") {
      const arr = body.lcm;
      if (!Array.isArray(arr) || arr.length === 0 || arr.length > 1000) {
        return badRequest(res, "lcm must be a non-empty array of integers");
      }
      if (!arr.every(isInt)) {
        return badRequest(res, "lcm must contain only integers");
      }
      data = arr.reduce((acc, n) => lcm(acc, n));
    }

    if (key === "hcf") {
      const arr = body.hcf;
      if (!Array.isArray(arr) || arr.length === 0 || arr.length > 1000) {
        return badRequest(res, "hcf must be a non-empty array of integers");
      }
      if (!arr.every(isInt)) {
        return badRequest(res, "hcf must contain only integers");
      }
      data = arr.reduce((acc, n) => gcd(acc, n));
    }

    if (key === "AI") {
      const question = body.AI;
      if (typeof question !== "string" || question.trim().length === 0) {
        return badRequest(res, "AI must be a non-empty string");
      }
      if (question.length > 1000) {
        return badRequest(res, "AI question is too long");
      }
      data = await getAiAnswer(question.trim());
    }

    return res.json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data,
    });
  } catch (err) {
    return next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: "Not Found",
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: err.message || "Internal Server Error",
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
