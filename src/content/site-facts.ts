export const siteFacts = {
  name: 'Fleuron',
  url: 'https://fleuron.study/',
  reviewedOn: '2026-10-25',
  // Kept word-for-word in step with the app's in-app Trust & permissions panel
  // (src/content/trust-and-permissions.ts) so the two surfaces cannot drift.
  localOnly: 'Everything stays on this computer: transcripts, codebook, coding and notes. This version of Fleuron has no accounts and no sync. It goes online only to check for updates and, after you approve one, to download it.',
  collaboration: 'Accounts, shared studies and sync are turned off, and the app makes no sync connection. A study that was already shared opens as a local study, keeps its group link, and keeps its unsent changes queued for when collaboration returns.',
  pricing: 'Fleuron is free and open source, and offline coding is free forever. Collaboration is paused, so there are no accounts and no paid tier to buy today. If a hosted service is offered later, its terms will be announced before any charge begins.',
  pricingShort: 'Free and open source · no account · no sync service',
  lead: 'Code interviews, organize evolving codes, and write analytic memos on macOS and Windows. Fleuron is free and open source, and your study stays in a folder on your own computer — no account, no upload, no sync service.',
  privacy: "Transcripts, codes and memos are stored in a study folder you choose, and Fleuron has no account or sync service, so that data does not leave your computer. Exports and backups are saved where you choose; they can leave the device when you share them or keep the folder in a synced location.",
  network: 'Coding works without an internet connection. The app goes online only to check for updates: it asks GitHub for the latest version at startup and periodically while open, and downloads an installer only when you approve. You can turn update checks off in Settings. There is no sign-in, session renewal or sync connection in this version.',
  saving: 'Passage notes and interview memos save themselves after a short typing pause. The toolbar shows Saved, Saving…, or how many notes are unsaved, and File > Save (Cmd/Ctrl+S) commits everything at once. Click Saved to see which folder holds the study and to open it.',
  website: 'We count page visits with Cloudflare Web Analytics, which uses no cookies and no cross-site tracking. It records the page visited, the referrer, and basic browser, device and load-performance facts. We run no Google Analytics, Plausible, PostHog, advertising trackers, or tracking pixels. Fonts, scripts, styles and images are served from this domain, except the Cloudflare analytics beacon. Cloudflare hosts the site and processes requests; its network error reporting can send browser reports about connection failures. The site is light-only and stores no preference in your browser. Download and support links take you to GitHub, which operates under its own policies.',
  platforms: 'Supported: macOS 14+ (Intel and Apple Silicon universal build) and Windows 11 x64. macOS 10.15–13 and Windows 10 are best effort. No Linux or native Windows ARM package is provided.',
  mac: 'macOS 14+ supported; 10.15–13 best effort',
  windows: 'Windows 11 x64 supported; Windows 10 best effort',
  signing: 'Current builds are not Apple-notarized or Windows publisher-signed. See the installation guide for expected warnings and when to stop.',
  sources: {
    repository: 'https://github.com/wilsonhyeh/fleuron',
    license: 'https://github.com/wilsonhyeh/fleuron/blob/main/LICENSE',
    privacy: 'https://github.com/wilsonhyeh/fleuron/blob/main/docs/PRIVACY-AND-PERMISSIONS.md',
    platforms: 'https://github.com/wilsonhyeh/fleuron/blob/main/docs/IT-DEPLOYMENT.md',
    nel: 'https://developers.cloudflare.com/network-error-logging/',
  },
} as const;
