# Deployment Runbook: fleuron.study

Step-by-step instructions for deploying `fleuron.study` to Cloudflare Pages and connecting Porkbun DNS.

---

## 1. Push site repository to GitHub

Create the public repository `wilson-taiwan/fleuron-site` on GitHub:

```bash
# In ~/Developer/fleuron-site
gh repo create wilson-taiwan/fleuron-site --public --source=. --remote=origin --push
```

---

## 2. Create Cloudflare Pages Project

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** → **Create application** → **Pages** tab → **Connect to Git**.
3. Select the repository: `wilson-taiwan/fleuron-site`.
4. Configure Build settings:
   - **Framework preset:** `Astro` (or `None`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** In **Environment variables (build)**, add `NODE_VERSION` = `22` (or `20`).
   - *(Optional)* `GITHUB_TOKEN`: Add a GitHub Personal Access Token (read-only / public repo scope) if anonymous GitHub API rate limits ever trip during build. (Not required initially).
5. Click **Save and Deploy**.
6. Cloudflare will build the site and assign a deployment subdomain, e.g. `<project-name>.pages.dev`.

---

## 3. Set up Deploy Hook in Cloudflare Pages

To enable automatic rebuilds when Fleuron releases are published on GitHub:

1. In Cloudflare Pages, go to your project → **Settings** → **Builds & deployments**.
2. Scroll to **Deploy hooks** and click **Add deploy hook**.
3. Name: `fleuron-release-published`, Branch: `main`.
4. Copy the generated webhook URL: `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/...`
5. Go to the app repository on GitHub: [github.com/wilson-taiwan/fleuron/settings/secrets/actions](https://github.com/wilson-taiwan/fleuron/settings/secrets/actions).
6. Click **New repository secret**:
   - **Name:** `CLOUDFLARE_PAGES_DEPLOY_HOOK`
   - **Secret:** *(Paste the deploy hook URL)*
7. Click **Add secret**.

*(Note: The app repo's `.github/workflows/notify-site.yml` will now trigger this hook automatically whenever a GitHub release is published).*

---

## 4. Connect Custom Domain in Cloudflare Pages

1. In Cloudflare Pages project → **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter `fleuron.study` and follow prompts.
4. Click **Set up a custom domain** again and add `www.fleuron.study`.

---

## 5. Configure DNS at Porkbun

Log in to [Porkbun Domain Management](https://porkbun.com/account/domains) → `fleuron.study` → **DNS Records**.

### Required DNS Records:

| Type | Host | Answer / Value | TTL | Notes |
| --- | --- | --- | --- | --- |
| `ALIAS` | *(leave blank / @)* | `<project-name>.pages.dev` | 600 | Porkbun ALIAS dynamically resolves to Cloudflare IPs at root |
| `CNAME` | `www` | `<project-name>.pages.dev` | 600 | CNAME for www subdomain |

> **Verification of Porkbun Apex ALIAS:** Porkbun DNS documentation explicitly supports ALIAS at the root domain (`@`), dynamically resolving CNAME flattening to A records. If using Porkbun URL forwarding instead, CNAME `www` to Pages and set a 301 URL forward from apex `fleuron.study` to `https://www.fleuron.study`.

### ⚠️ Critical Note on `mail.fleuron.study`:
**DO NOT delete or modify DNS records for `mail.fleuron.study` or Resend/Supabase custom SMTP.**
The password-reset mail infrastructure on `mail.fleuron.study` is independent and must coexist peacefully in the DNS zone. Adding the apex (`@`) and `www` records does not interfere with `mail.fleuron.study`.

---

## 6. Merge App Repo Documentation Branch

In `~/Developer/codemap`:

```bash
# Verify branch commits
git log -n 2

# Push branch and merge into main
git push origin site/official-urls
# Open PR or merge site/official-urls into main on wilson-taiwan/fleuron
```

---

## 7. Verification after Cutover

Once DNS propagates (usually 2–10 minutes):

1. **Test Apex Domain:**
   ```bash
   curl -sI https://fleuron.study | head -n 10
   ```
   Confirm HTTP 200 (or 301 to https/www) over valid TLS certificate without redirect loops.

2. **Test WWW Domain:**
   ```bash
   curl -sI https://www.fleuron.study | head -n 10
   ```

3. **Verify Download Links:**
   Visit `https://fleuron.study/download` in browser. Click both download buttons and verify they start direct downloads from `https://github.com/wilson-taiwan/fleuron/releases/download/...`.

4. **Verify Mirrored Install Page:**
   Visit `https://fleuron.study/install`. Confirm all 11 sections render and the commit SHA matches GitHub.
