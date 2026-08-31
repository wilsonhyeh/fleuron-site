# Search discovery and maintenance

This is a manual runbook, not an automated monitor. Preparing a site, publishing it, submitting URLs, having them indexed and ranking for a query are separate states. No indexing deadline or ranking outcome is promised.

## Ownership and submission

After approved deployment and successful `check-deployed.mjs --production-hosts`:

1. Reuse an existing **fleuron.study Domain property** in Google Search Console. If absent, add that property under the maintainer's existing account. Obtain the actual provider-issued TXT value and add it at Porkbun without replacing other TXT records. Keep it after verification. Do not invent verification values or store private account screenshots in public source. [Google ownership verification](https://support.google.com/webmasters/answer/9008080).
2. Submit `https://fleuron.study/sitemap.xml`. It contains the nine final page URLs from `src/content/site-pages.json`, not downloads, preview hosts or sample output files. Google ignores `priority` and `changefreq`; omit `lastmod` unless tied to an actual substantive page change. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
3. Use URL Inspection live tests on home and `/download/`, and inspect guides/comparison for access or indexability errors. Request indexing once for important final URLs. Record Google's selected URL when available; new URLs may not have a selected canonical yet. Check Page Indexing, Security Issues and Manual Actions. Do not weaken bot/security controls without evidence. [URL Inspection](https://support.google.com/webmasters/answer/9012289), [recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
4. Reuse/add the site in Bing Webmaster Tools, verify directly, and submit the same sitemap and principal URLs. Importing from Search Console requires authorization for that account connection; do not assume it. Record accepted submissions separately from indexed pages. [Bing Webmaster Tools](https://www.bing.com/webmasters/).
5. If sign-in is needed, record that blocker and request access after completing other work. Do not fabricate dashboard results. DNS ownership verification does not require visitor analytics, a marketing tag or a new cookie banner.

Do not use Google's Indexing API for ordinary website pages, an instant-indexing service or repeated submission loops. Crawl requests do not guarantee inclusion. [Google Search Essentials](https://developers.google.com/search/docs/essentials).

## D0 baseline

D0 is the actual approved submission date, not the date this document was written. Record privately:

- Site commit/deployment, app release version, mirrored document file SHA and content review dates.
- Registry/sitemap page count; verified host and missing-page behavior.
- Ownership and submission status for both engines, with dates.
- Indexed-page observations and selected URLs where available.
- Search impressions, clicks, queries and pages over a stated date range. A new property with no report is **not yet available**, not measured zero traffic.
- Public GitHub homepage, description and topics, read back after any approved change.

Useful non-brand query families include free qualitative analysis software, free qualitative data analysis software, qualitative coding software, code interview transcripts, and reflexive thematic analysis software. Treat these as relevance goals, not fabricated keyword-volume estimates.

## Manual checkpoints

Review at D0+7, D0+28 and D0+56; create no scheduler under this change. Compare like date ranges and record any report lag. Look at indexability problems, selected URLs, non-brand impressions/clicks and which pages answer real queries. Early average position alone is not success or failure. Without download instrumentation, visits do not measure downloads or adoption.

| Observation | Next action |
| --- | --- |
| Not discovered | Verify ownership, sitemap accessibility and internal links; inspect the exact final URL. |
| Discovered but not crawled | Check availability/server errors, then allow crawling time. Do not repeat requests in a loop. |
| Crawled but not indexed | Review duplicate hosts, selected URLs, thin/repetitive content and actual usefulness. |
| Indexed without impressions | Improve fit to real research tasks and useful exposure; no keyword stuffing or near-duplicate pages. |
| Impressions without clicks | Read the search result title/snippet against the query and improve accuracy/usefulness. |
| Clicks without known downloads | State the measurement limit. Do not infer conversion from visits. |

## Content and technical review

- Before a pricing-policy change, review homepage, FAQ, privacy/support, app README and BetaNotice together. Keep offline-free and optional hosted-service scope clear.
- At support-policy/release changes, review OS claims, signing state, filenames and installation instructions. Public app source changes do not change old installers.
- On substantive comparison review, revisit primary product sources and record what was checked. Change the visible date only then, never for a routine rebuild.
- Keep the developer relationship explicit, offer reasons to choose other tools and preserve sourced limitations. Never add invented ratings, testimonials or institutional endorsements.
- Keep `SoftwareApplication` facts consistent with visible copy. Its free offer describes offline coding, not unlimited future hosting. Structured data alone does not establish rich-result eligibility; do not invent a review to satisfy eligibility fields. [Software application markup](https://developers.google.com/search/docs/appearance/structured-data/software-app).
- Run `npm run verify` after material changes. Review screenshot/binary examples separately from text privacy scanning. For regenerated examples, rerun a real isolated native workflow and update manifest hashes only after inspection; a valid hash does not prove content is truthful.
- After each approved deployment, run the deployed GET checks and compare the release/docs version consumed with the reviewed build. Preserve release and weekly rebuild hooks; add no new schedules.

## Optional later: IndexNow

Deferred for this nine-page site. If separately approved later, use the official key-file verification procedure, publish only the generated public verification key at its required same-host location, and notify participating engines of changed final public URLs after a successful deployment. Never submit private, preview or error URLs. It does not replace Google Search Console or guarantee indexing. [Official IndexNow documentation](https://www.indexnow.org/documentation).

## Distribution boundaries

Directory entries and individually relevant library/methods-resource suggestions can help people discover the tool. The maintainer must approve exact content and destinations before submission. Disclose authorship, link the synthetic tutorial and platform/signing limits, and ask for evaluation. Do not buy links, mass-email, invent an independent review or claim a library has endorsed the tool because it received a suggestion.
