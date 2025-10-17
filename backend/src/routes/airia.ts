import express from "express";
import crypto from "crypto";

const router = express.Router();

// GET handler for webhook info
router.get("/airia/finsage", (req, res) => {
  res.json({
    message: "FinSage Airia Webhook Endpoint",
    method: "POST",
    description: "This endpoint receives webhook events from Airia",
    example: {
      method: "POST",
      url: "/airia/finsage",
      headers: {
        "Content-Type": "application/json",
        "x-airia-signature": "optional-hmac-signature"
      },
      body: {
        tickers: ["AAPL", "MSFT", "NVDA"],
        mode: "SUGGEST",
        config_url: "https://example.com/config"
      }
    },
    security: {
      hmac_verification: process.env['AIRIA_WEBHOOK_SECRET'] ? "enabled" : "disabled"
    }
  });
});

router.post("/airia/finsage", express.json(), (req, res) => {
  const signature = req.headers["x-airia-signature"];
  const secret = process.env['AIRIA_WEBHOOK_SECRET'];
  const body = JSON.stringify(req.body);

  // ✅ Optional HMAC verification
  if (secret && signature) {
    try {
      const computed = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      if (computed !== signature) {
        console.warn("⚠️ Airia signature mismatch");
        return res.status(401).json({ error: "Invalid signature" });
      }
    } catch (err) {
      console.error("Error verifying Airia signature:", err);
    }
  }

  // ✅ Handle the event
  console.log("✅ Airia event received:", req.body);

  // Log event to audit if available
  try {
    const fs = require("fs");
    const logPath = process.env['AUDIT_LOG_DIR'] || "backend/runtime_logs";
    const logLine = `${new Date().toISOString()} Airia event: ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync(`${logPath}/airia_events.log`, logLine);
  } catch (err) {
    console.error("Audit log write failed:", err);
  }

  return res.json({ ok: true });
});

export default router;
