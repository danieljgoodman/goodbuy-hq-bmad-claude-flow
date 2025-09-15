# Premium Feature Testing Guide

## Quick Test Accounts

### Admin Account (Full Access)
- **Email**: `admin@goodbuyhq.com`  
- **Password**: Any password during registration
- **Access**: All premium features + admin dashboard
- **Why it works**: Navbar checks for "admin" in email

### Regular Premium Test
- **URL**: `/subscription`
- **Test Card**: `4242 4242 4242 4242`
- **Expiry**: `12/25` (any future date)
- **CVC**: `123` (any 3 digits)

## Premium Features to Test

### 🔒 Premium Only:
1. **`/guides`** - AI Implementation Guides
   - Generates step-by-step improvement plans
   - Business context integration
   - Template downloads

2. **`/analytics`** - Advanced Analytics  
   - Trend analysis with confidence intervals
   - Predictive forecasting
   - Statistical modeling

3. **`/benchmarking`** - Industry Comparison
   - Compare against industry peers
   - Competitive positioning
   - Market trend analysis

4. **`/reports`** - Professional PDF Reports
   - High-quality downloadable reports
   - Charts and professional formatting
   - Stakeholder-ready documents

5. **`/support`** - Priority Support
   - 2-hour SLA (vs 24-hour free)
   - Priority ticket processing
   - Customer success tracking

6. **`/admin`** - Business Owner Dashboard
   - Platform-wide success metrics
   - Testimonial management
   - User analytics

### 🆓 Always Free:
- `/dashboard` - Basic dashboard
- `/onboarding` - Core business evaluation
- Basic notifications
- Account management

## Testing Premium Access

When logged in, premium features will:
- ✅ **Work normally** if premium access
- ⚠️ **Show upgrade prompts** if free tier
- 🚫 **Redirect to subscription** if not authenticated

## Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002  
3D Auth: 4000 0025 0000 3155
```

## Database Premium Toggle (Manual)

If you have direct database access:

```sql
-- Make any user premium
UPDATE users 
SET "subscriptionTier" = 'PREMIUM' 
WHERE email = 'your-test-email@example.com';
```

## Environment Requirements

Ensure these are set in your `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Quick Start

1. **Start app**: `npm run dev`
2. **Register**: `admin@goodbuyhq.com` 
3. **Test premium features**: Navigate to `/guides`, `/analytics`, etc.
4. **Admin features**: Go to `/admin`