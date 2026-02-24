# Domain Name Options

## Registrars

| Registrar | Approx. price/yr | Notes |
|---|---|---|
| **Cloudflare Registrar** | ~$10 | At-cost pricing (no markup), free WHOIS privacy, built-in CDN/DNS |
| **Namecheap** | ~$10–14 | Cheap first year deals, free WHOIS privacy, clean UI |
| **Google Domains** → Squarespace | ~$12 | Google sold Google Domains to Squarespace in 2023 |
| **GoDaddy** | ~$12–20 | Widely known but pushes upsells; renewal prices jump after year 1 |
| **Porkbun** | ~$10–12 | Competitive pricing, free WHOIS privacy, simple UI |
| **Local registrar** | Varies | Already have one — see options below |

---

## If you already have a domain from a local registrar

You have three options:

### Option A — Keep local registrar, point DNS to Cloudflare (Recommended)
- Stay with your current registrar for registration/renewal
- Change the nameservers to Cloudflare's (`ns1.cloudflare.com`, `ns2.cloudflare.com`)
- Cloudflare handles all DNS records, CDN, SSL, and DDoS protection for free
- No transfer needed, takes effect in minutes

### Option B — Transfer domain to Cloudflare
- Move the registration itself to Cloudflare Registrar
- Cheaper long-term (at-cost renewal, no markup)
- Requires domain to be at least 60 days old and unlocked at current registrar
- Takes 5–7 days to complete the transfer

### Option C — Keep everything at local registrar
- Use your registrar's own DNS management
- Add CNAME/A records there pointing to Cloud Run service URLs
- No Cloudflare benefits (CDN, DDoS protection, analytics)
- Fine for internal/admin tools, less ideal for a public storefront

---

## Recommendation

**Option A** is the easiest starting point — no transfer, free Cloudflare plan covers:
- Global CDN (faster page loads)
- Free SSL/TLS at the edge
- DDoS protection
- DNS propagation in seconds instead of hours
- Easy subdomain management for staging (`staging.mystore.com`)

If you want to consolidate registrar + DNS in one place later, do **Option B**.

---

## Subdomain plan for this project

| Subdomain | Points to |
|---|---|
| `mystore.com` | Cloud Run — `sierra-web` (production) |
| `admin.mystore.com` | Cloud Run — `sierra-admin` (production) |
| `staging.mystore.com` | Cloud Run — `sierra-web-staging` |
| `admin.staging.mystore.com` | Cloud Run — `sierra-admin-staging` |
