# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel (Traditional Server Mode)
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (Next.js build output)
- **CDN/Edge:** Vercel Global Edge Network with automatic static asset optimization

**Backend Deployment:**
- **Platform:** Vercel Functions (Traditional Server Runtime)
- **Build Command:** `npm run build` (includes API routes)
- **Deployment Method:** Git-based continuous deployment with preview environments

## CI/CD Pipeline

Comprehensive GitHub Actions workflow with testing, building, security scanning, and automated deployment to staging and production environments.

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3000/api | Local development |
| Staging | https://goodbuy-hq-staging.vercel.app | https://goodbuy-hq-staging.vercel.app/api | Pre-production testing |
| Production | https://goodbuy-hq.com | https://goodbuy-hq.com/api | Live environment |
