# Securing Your Google Maps API Key

## Current Status

Your API key is visible in the browser (this is normal for client-side APIs), but you need to add restrictions to prevent abuse.

## Required Security Steps

### 1. Add HTTP Referrer Restrictions

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under "Application restrictions":
   - Select **"HTTP referrers (web sites)"**
   - Add these referrers:
     ```
     http://localhost:3000/*
     http://localhost:*/*
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     ```

### 2. Restrict Which APIs Can Be Used

In the same API key settings:

1. Under "API restrictions":
   - Select **"Restrict key"**
   - Check **only** these APIs:
     - ✅ Maps JavaScript API
     - ✅ Places API
   - Uncheck everything else

### 3. Set Up Quotas and Alerts

1. Go to: https://console.cloud.google.com/apis/dashboard
2. Set daily quotas for:
   - Places API Autocomplete: 1,000 requests/day (adjust as needed)
3. Set up billing alerts to notify you if usage exceeds expected amounts

### 4. Monitor Usage

Regularly check: https://console.cloud.google.com/apis/dashboard

- Watch for unusual spikes in requests
- Review which domains are making requests

## Why This Approach is Secure Enough

✅ **Referrer restrictions** prevent other websites from using your key
✅ **API restrictions** prevent the key from being used for other Google services
✅ **Quotas** limit damage if the key is somehow abused
✅ **You get $200/month free** - unlikely to exceed with normal use

## What NOT to Do

❌ **Don't put secret keys in client code** (payment processing, admin operations)
❌ **Don't use the same key for server-side and client-side operations**
❌ **Don't disable restrictions** thinking it will "simplify" things

## Alternative: Server-Side Proxy (More Secure, But Overkill for Most Cases)

If you want maximum security, you can proxy the requests through your backend:

### Benefits:

- API key never exposed to client
- More granular control over requests
- Can add custom rate limiting
- Can log/monitor all requests

### Drawbacks:

- More complex setup
- Additional server costs
- Slower response times (extra hop)
- More maintenance

For a standard web app like Parkit, **HTTP referrer restrictions + API restrictions are sufficient**.

## Current Risk Level

**With no restrictions**: 🔴 HIGH RISK

- Anyone can copy your key and use it on their website
- Could rack up charges

**With proper restrictions**: 🟢 LOW RISK

- Key only works on your domains
- Limited to specific APIs
- Protected by quotas

## Immediate Action Required

Go to Google Cloud Console NOW and add:

1. HTTP referrer restrictions
2. API restrictions

This takes 2 minutes and prevents 99% of potential abuse.
