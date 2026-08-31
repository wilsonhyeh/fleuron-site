# Maintaining fleuron.study

The existing site is `wilson-taiwan/fleuron-site`, Cloudflare Pages project `fleuron-site`, production branch `main`. The app source is `wilson-taiwan/fleuron`; app installers remain GitHub release assets. DNS stays at Porkbun. This runbook does not authorize publication or account changes.

Do not recreate either repository or Pages project, add remotes, move nameservers, or replace the DNS zone. Never modify mail, MX, SPF, DKIM, DMARC or existing verification records. This project currently uses Direct Upload; a GitHub push runs CI but does not publish the site.

## Before publication

1. Review the exact diff and untracked files in both checkouts. Preserve unrelated work. Record the current production deployment ID, commit and prior build settings privately as the rollback destination; do not put account IDs, DNS exports, credentials or deploy-hook URLs in this repository.
2. Use Node 22.12 or newer, matching `package.json`. Install with `npm ci`. For the full local/CI gate, install Chromium with `npx playwright install chromium` (CI uses `--with-deps`).
3. Run `npm run verify` in this repository. It builds, checks Astro/TypeScript, internal links, unit/privacy regressions, external asset references, SEO structure, sample integrity, computed contrast and browser behavior. A new contributor also reviews examples visually. Do not describe this as a security certification.
4. For the accompanying app-copy changes, run `npx tsc --noEmit`, `npm test`, and `npm run build` in the app checkout. These changes do not alter sync/auth/billing behavior or release a new installer. Installed v2.1.0 binaries retain their existing in-app wording until a separately approved app release.
5. Record the resolved release version and mirrored `docs/INSTALLING.md` source-file SHA shown by the build. That SHA identifies a Git blob, not a commit. The mirror follows published app `main`, not uncommitted files in a sibling checkout. Publish approved app documentation before the site build that depends on it, then rebuild and review the mirror.
6. Request approval for the concrete site/app-source publication batch, GitHub settings, and host changes separately from outreach. No public listing or message is included implicitly.

## Existing build configuration

The live Pages API was checked on 2026-08-30: this project has no Git source or hosted build command and uses Direct Upload. Build locally with Node 22.12+ and `npm run verify`, then upload the reviewed `dist` to the existing project. Keep production branch `main`. CI also runs `npm run verify` with Chromium. Do not invent a hosted build setting or recreate the project to add Git integration. See [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Preserve the existing app release-published hook and `.github/workflows/scheduled-rebuild.yml` weekly hook trigger. Their presence does not prove automatic rebuilds work: no Git build source is configured on this project. Automatic rebuild/deploy wiring needs separate repair with an appropriate deployment credential; until verified, rebuild and publish manually after app releases. Do not create another schedule. Secret hook URLs stay in secret storage. The release fetcher still rejects draft/prerelease results; do not weaken it to make a build pass.

Builds fetch the current public release and installation document. A later local or CI build can consume different upstream content. Compare the published version/file SHA with the reviewed local build and rerun review if either changed. A successful build alone is not evidence that new upstream copy was reviewed.

## Publication order

1. Publish only the approved app-source documentation/copy changes, using the repository's normal review process. Do not tag, bump versions, sign or release binaries.
2. Rebuild the website against the published document. Review all nine registry pages and the sample artifacts. Rerun the gates. If release/docs differ from the review package, inspect the difference before continuing.
3. Commit and push the approved site changes, preserving existing commits. After CI succeeds, deploy the already verified build using `npx wrangler pages deploy dist --project-name fleuron-site --branch main` from the clean site checkout. Use the existing authenticated Wrangler profile. Do not create a project or deploy an unreviewed rebuild. Record the returned deployment URL/ID and source commit.
4. Check the apex before touching other hosts:

```sh
node scripts/check-deployed.mjs --base https://fleuron.study
```

The nine final HTML URLs must return direct 200s, slashless URLs must permanently redirect, and a missing address must return 404. Root `404.html` prevents Pages' SPA fallback. `src/content/site-pages.json` is the shared route/metadata/sitemap/test registry; public example reports are excluded from the sitemap and carry an `/examples/*` noindex response rule.

## Consolidate duplicate production hosts

Apply only after the apex is healthy and the exact account/DNS changes are approved.

### Production pages.dev

In the Cloudflare account's Bulk Redirects, reuse a relevant existing list/rule or create one for **only** `fleuron-site.pages.dev/` to `https://fleuron.study/`, status 301. Enable subpath matching, preserve path suffix and preserve query string; leave include-subdomains disabled. Follow [Cloudflare's Pages custom-domain redirect procedure](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/). Do not use a wildcard that redirects deployment previews. `_redirects` does not support domain-level redirects; see [Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/).

### www at Porkbun

Record only the current www CNAME and TTL needed for rollback. In Porkbun URL forwarding, set the subdomain to `www`, destination `https://fleuron.study`, permanent 301, requested URI path included, wildcard forwarding disabled. Remove/replace only the conflicting www record if required. Leave the apex ALIAS untouched. Keep the Pages www custom-domain association while verifying, so DNS rollback remains quick.

[Porkbun's forwarding instructions](https://kb.porkbun.com/article/39-how-to-set-up-url-forwarding) describe the available controls and HTTPS forwarding. Verify real behavior instead of assuming the form guarantees it. If www HTTPS, path or query preservation fails, remove only the new forward and restore the former www CNAME/TTL. Do not migrate nameservers or add a Worker as an improvised fallback.

### Check every host

```sh
node scripts/check-deployed.mjs --base https://fleuron.study --production-hosts
```

This bounded read-only GET check tests HTTP apex, HTTP/HTTPS www and HTTPS production pages.dev using `/download/?audit=1`. Each must finish at `https://fleuron.study/download/?audit=1` through permanent redirects without a loop.

Also inspect one current preview URL obtained from Pages (do not invent its deployment hostname): it remains usable and has `X-Robots-Tag: noindex`. The `_headers` preview rule is hostname-specific. Confirm the apex has no noindex header or meta tag. Check a public example response for its intended noindex header. Compare mail DNS records with the pre-change evidence; they must be unchanged. Preview headers, DNS and Search Console are not simulated by the local test server.

NEL/Report-To header presence is recorded by the script. NEL remains enabled and disclosed; this is not an external-request failure. Static scanning only checks asset references; browser tests check page-initiated resources and do not claim to observe all browser-managed reporting.

## Rollback

If the apex deployment is broken, select the recorded prior Pages production deployment or create a normal reviewed revert of only this batch. Preserve later/unrelated work. Restore prior build settings if this batch's setting change is responsible.

If host consolidation fails, restore www's recorded CNAME/TTL and remove this batch's forwarding entry. Disable only the changed/new Bulk Redirect rule as necessary. Do not reset branch history, delete the Pages project, reset DNS or touch mail records. Recheck HTTPS, page availability and downloads after rollback. Record what remains unresolved.

## Release record

Keep a private record of authorization scope, source commits, deployment ID, resolved release/docs SHA, executed commands/results, host/preview checks, mail preservation and rollback destination. Never record tokens or raw credential-bearing responses. Only then proceed to [search verification and maintenance](docs/SEARCH-MAINTENANCE.md).
