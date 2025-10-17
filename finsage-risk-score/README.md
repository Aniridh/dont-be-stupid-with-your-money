# FinSage Risk Scoring Service

A minimal FastAPI microservice that computes risk scores for financial instruments.

## Features

- **Risk Scoring**: Calculates risk scores (0-1) based on RSI, P/E ratio, sentiment, and ATR
- **FastAPI**: Modern Python web framework with automatic API documentation
- **TrueFoundry Ready**: Configured for deployment on TrueFoundry platform

## API Endpoints

### POST `/score`

Calculate risk score for a financial instrument.

**Request Body:**
```json
{
  "ticker": "AAPL",
  "rsi": 65.5,
  "pe": 25.2,
  "peg": 1.1,
  "sentiment": 0.3,
  "atr": 2.5
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "risk_score": 0.342,
  "timestamp": 1699123456.789,
  "latency_ms": 15,
  "model_version": "v0.1"
}
```

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python app.py
```

The service will be available at `http://localhost:8080`

## API Documentation

Visit `http://localhost:8080/docs` for interactive API documentation.

## TrueFoundry Deployment

This service is configured to run on port 8080 and is ready for TrueFoundry deployment.
