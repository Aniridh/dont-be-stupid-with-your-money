# FinSage Production Deployment Checklist

## 🚀 Pre-Deployment Verification

### ✅ Local Development Status
- [x] Backend MCP server running on port 3001
- [x] Frontend Next.js app running on port 3000
- [x] Health endpoints responding correctly
- [x] Demo data available for frontend
- [x] CORS configured for local development
- [x] Airia webhook endpoint functional

### ✅ TrueFoundry Risk Scoring Service
- [x] `app.py` FastAPI service created
- [x] `requirements.txt` with dependencies
- [x] `deploy.py` Python SDK deployment script
- [x] `truefoundry.yaml` CLI deployment config
- [x] Port 8000 configuration aligned
- [x] Service name: `finsage-server`

## 🔧 Production Environment Setup

### Environment Variables Required
```bash
# Backend Configuration
STUB_MODE=false
PORT=3001
SENTRY_DSN=your_sentry_dsn_here

# Live Data Sources
LIVE_NEWS=true
LIVE_QUOTES=true
LIVE_FUNDS=true
LIVE_TF_GATEWAY=true

# API Keys
APIFY_TOKEN=your_apify_token
APIFY_ACTOR_ID=your_apify_actor_id
TRUEFOUNDRY_API_KEY=your_truefoundry_key
TRUEFOUNDRY_GATEWAY_URL=your_gateway_url

# Airia Integration
AIRIA_WEBHOOK_SECRET=your_webhook_secret
AIRIA_API_KEY=your_airia_key

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

## 🌐 Deployment Targets

### 1. TrueFoundry Risk Scoring Service
- **Service Name**: `finsage-server`
- **Workspace**: `odsc-cluster:sfhack`
- **URL**: `https://finsage-server-sfhack-8000.ml.odsc-demo.truefoundry.cloud`
- **Deployment**: `python deploy.py`

### 2. Backend MCP Server
- **Platform**: Vercel, Railway, or similar
- **Port**: 3001
- **Environment**: Production with LIVE mode enabled
- **Health Check**: `/health` endpoint

### 3. Frontend Dashboard
- **Platform**: Vercel (recommended for Next.js)
- **Environment**: Production build
- **Backend URL**: Configured via `NEXT_PUBLIC_BACKEND_URL`

## 📋 Deployment Steps

### Step 1: Deploy TrueFoundry Service
```bash
# Install TrueFoundry SDK
pip install truefoundry

# Deploy risk scoring service
python deploy.py
```

### Step 2: Deploy Backend
```bash
# Build and deploy backend
cd backend
npm run build
# Deploy to your chosen platform
```

### Step 3: Deploy Frontend
```bash
# Build and deploy frontend
cd frontend
npm run build
# Deploy to Vercel or similar
```

### Step 4: Configure Environment Variables
- Set all required environment variables in production
- Update `NEXT_PUBLIC_BACKEND_URL` to point to production backend
- Configure API keys for live data sources

## 🧪 Post-Deployment Testing

### Health Checks
- [ ] Backend health: `GET /health`
- [ ] Frontend loading: Dashboard displays correctly
- [ ] Risk scoring: `POST /score` endpoint functional
- [ ] Airia webhook: `POST /airia/finsage` responding

### Integration Tests
- [ ] Frontend connects to backend
- [ ] Live data sources working (if enabled)
- [ ] TrueFoundry risk scoring integration
- [ ] Airia webhook receiving events

## 🔍 Monitoring & Observability

### Sentry Integration
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Custom tags set (`service=backend`, `env=production`)

### Logging
- [ ] Audit logs enabled
- [ ] Sensitive data redaction working
- [ ] Log aggregation configured

## 📊 Demo Preparation

### Demo Flow
1. Show frontend dashboard with live data
2. Click source_ref chips to show audit trail
3. Demonstrate risk scoring via TrueFoundry
4. Show Airia webhook integration
5. Display provider badges (LIVE vs STUB)

### Key Features to Highlight
- Real-time portfolio monitoring
- Multi-source data integration
- Risk scoring with AI/ML
- Audit trail and transparency
- Sponsor tool integrations

## 🚨 Rollback Plan

### Quick Rollback Steps
1. Revert environment variables to STUB_MODE=true
2. Deploy previous version if needed
3. Disable live data sources
4. Notify stakeholders of temporary demo mode

---

**Status**: Ready for production deployment
**Last Updated**: October 17, 2025
**Next Action**: Deploy TrueFoundry service and test integration
