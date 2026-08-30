import { marked } from 'marked';

export interface InstallingDocData {
  rawMarkdown: string;
  html: string;
  sha: string;
  shortSha: string;
  sourceUrl: string;
}

const KNOWN_LINK_MAPPINGS: Record<string, string> = {
  'IT-DEPLOYMENT.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/docs/IT-DEPLOYMENT.md',
  'docs/IT-DEPLOYMENT.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/docs/IT-DEPLOYMENT.md',
  'PRIVACY-AND-PERMISSIONS.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/docs/PRIVACY-AND-PERMISSIONS.md',
  'docs/PRIVACY-AND-PERMISSIONS.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/docs/PRIVACY-AND-PERMISSIONS.md',
  'USER-GUIDE.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/docs/USER-GUIDE.md',
  'docs/USER-GUIDE.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/docs/USER-GUIDE.md',
  'SUPPORT.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/SUPPORT.md',
  'SECURITY.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/SECURITY.md',
  'CHANGELOG.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/CHANGELOG.md',
  'README.md': 'https://github.com/wilson-taiwan/fleuron/blob/main/README.md',
  'support/': 'https://github.com/wilson-taiwan/fleuron/tree/main/support',
  'support': 'https://github.com/wilson-taiwan/fleuron/tree/main/support',
};

export function rewriteMarkdownLinks(markdown: string): string {
  // Regex to match markdown links [text](url)
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const trimmedUrl = url.trim();
    // Ignore absolute URLs, hash anchors, and mailto
    if (
      trimmedUrl.startsWith('http://') ||
      trimmedUrl.startsWith('https://') ||
      trimmedUrl.startsWith('#') ||
      trimmedUrl.startsWith('mailto:')
    ) {
      return match;
    }

    const mapped = KNOWN_LINK_MAPPINGS[trimmedUrl];
    if (!mapped) {
      throw new Error(`Build failed: unmapped relative link in INSTALLING.md: "${trimmedUrl}"`);
    }

    return `[${text}](${mapped})`;
  });
}

export function transformInstallingMarkdown(markdown: string, sha: string): InstallingDocData {
  if (!markdown || !markdown.trim()) {
    throw new Error('Build failed: INSTALLING.md content is empty');
  }

  const rewritten = rewriteMarkdownLinks(markdown);
  const html = marked.parse(rewritten, { async: false }) as string;
  const shortSha = sha ? sha.slice(0, 7) : 'unknown';

  return {
    rawMarkdown: markdown,
    html,
    sha: sha || '',
    shortSha,
    sourceUrl: 'https://github.com/wilson-taiwan/fleuron/blob/main/docs/INSTALLING.md',
  };
}

let cachedDoc: InstallingDocData | null = null;

export async function fetchInstallingDoc(): Promise<InstallingDocData> {
  if (cachedDoc) {
    return cachedDoc;
  }

  const contentsApiUrl = 'https://api.github.com/repos/wilson-taiwan/fleuron/contents/docs/INSTALLING.md';
  const headers: Record<string, string> = {
    'User-Agent': 'fleuron-site-build',
    Accept: 'application/vnd.github.v3+json',
  };

  const token = typeof process !== 'undefined' ? process.env.GITHUB_TOKEN : undefined;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(contentsApiUrl, { headers });
  } catch (err: any) {
    throw new Error(`Build failed: network fetch failed for ${contentsApiUrl} (${err?.message || err})`);
  }

  if (res.status !== 200) {
    throw new Error(
      `Build failed: GitHub Contents API returned HTTP ${res.status} ${res.statusText} for docs/INSTALLING.md`
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch (err: any) {
    throw new Error(`Build failed: failed to parse JSON from GitHub Contents API (${err?.message || err})`);
  }

  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Build failed: missing or invalid content field in GitHub Contents API response');
  }

  const markdown = Buffer.from(data.content, 'base64').toString('utf-8');
  cachedDoc = transformInstallingMarkdown(markdown, data.sha);
  return cachedDoc;
}
