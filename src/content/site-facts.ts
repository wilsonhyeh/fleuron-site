export const siteFacts = {
  name: 'Fleuron',
  url: 'https://fleuron.study/',
  reviewedOn: '2026-10-25',
  // Kept word-for-word in step with the app's in-app Trust & permissions panel
  // (src/content/trust-and-permissions.ts) so the two surfaces cannot drift.
  localOnly: 'Everything stays on this computer: transcripts, codebook, coding and notes. This version of Fleuron has no accounts and no sync. It goes online only to check for updates and, after you approve one, to download it.',
  pricing: 'Fleuron is free and open source, and coding is free forever. No accounts, no paid tier; if a paid version is offered later, its terms will be announced before any charge begins.',
  pricingShort: 'Free and open source · no account · no sync service',
  lead: 'Code interviews, organize evolving codes, and write analytic memos on macOS and Windows. Fleuron is free and open source, and your study stays in a folder on your own computer — no account, no upload, no sync service.',
  privacy: "Transcripts, codes and memos are stored in a study folder you choose, and Fleuron has no account or sync service, so that data does not leave your computer. Exports and backups are saved where you choose; they can leave the device when you share them or keep the folder in a synced location.",
  network: 'Coding works offline. Fleuron contacts GitHub only to check for updates, asks for the latest version at startup and periodically while open, and downloads an installer only when you approve. Update checks can be turned off in Settings.',
  website: 'Page visits are counted with Cloudflare Web Analytics, which sets no cookies and does not track you across sites. It records the page, the referrer and basic browser and device facts; no advertising or third-party analytics trackers run here. Fonts, styles, scripts and images are served from this domain, apart from the analytics beacon. Cloudflare hosts the site and can receive browser error reports. Download and support links go to GitHub, which has its own policies.',
  platforms: 'macOS 14+ (Intel and Apple Silicon) and Windows 11 x64. Older versions are best effort; no Linux or Windows ARM build.',
  mac: 'macOS 14+ supported; 10.15–13 best effort',
  windows: 'Windows 11 x64 supported; Windows 10 best effort',
  signing: 'Current builds are not Apple-notarized or Windows publisher-signed.',
  sources: {
    repository: 'https://github.com/wilsonhyeh/fleuron',
    license: 'https://github.com/wilsonhyeh/fleuron/blob/main/LICENSE',
    privacy: 'https://github.com/wilsonhyeh/fleuron/blob/main/docs/PRIVACY-AND-PERMISSIONS.md',
    platforms: 'https://github.com/wilsonhyeh/fleuron/blob/main/docs/IT-DEPLOYMENT.md',
    nel: 'https://developers.cloudflare.com/network-error-logging/',
  },
} as const;
