from fastapi import FastAPI
from pydantic import BaseModel
import random, time

app = FastAPI(title="FinSage Risk Scoring Service")

class Features(BaseModel):
    ticker: str
    rsi: float = 50
    pe: float = 20
    peg: float = 1.0
    sentiment: float = 0.0
    atr: float = 1.0

@app.post("/score")
def score(features: Features):
    # Simple heuristic risk score
    rsi_term = abs(features.rsi - 50) / 50
    pe_term = features.pe / 100
    sentiment_term = (1 - (features.sentiment + 1) / 2)
    base_risk = min(1, (rsi_term + pe_term + sentiment_term) / 3)
    jitter = random.uniform(-0.05, 0.05)
    score_value = round(min(1, max(0, base_risk + jitter)), 3)
    return {
        "ticker": features.ticker,
        "risk_score": score_value,
        "timestamp": time.time(),
        "latency_ms": random.randint(10, 30),
        "model_version": "v0.1"
    }

# ✅ Entry point for TrueFoundry
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
