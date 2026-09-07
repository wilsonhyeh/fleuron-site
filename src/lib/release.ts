export interface ReleaseAsset {
  url: string;
  name: string;
  size: number;
  formattedSize: string;
}

export interface ReleaseData {
  version: string;
  publishedAt: string;
  mac: ReleaseAsset;
  win: ReleaseAsset;
  checksumsUrl: string;
  releaseUrl: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parseReleasePayload(data: any): ReleaseData {
  if (!data || typeof data !== 'object') {
    throw new Error('Release validation failed: payload is not a valid JSON object');
  }

  if (data.draft === true) {
    throw new Error('Release validation failed: latest release is marked as draft');
  }

  if (data.prerelease === true) {
    throw new Error('Release validation failed: latest release is marked as prerelease');
  }

  if (!data.tag_name || typeof data.tag_name !== 'string') {
    throw new Error('Release validation failed: missing or invalid tag_name');
  }

  const version = data.tag_name.replace(/^v/, '');
  if (!version) {
    throw new Error(`Release validation failed: invalid tag_name "${data.tag_name}"`);
  }

  const publishedAt = data.published_at
    ? data.published_at.split('T')[0]
    : data.created_at
    ? data.created_at.split('T')[0]
    : '';

  const assets = Array.isArray(data.assets) ? data.assets : [];

  const macAsset = assets.find(
    (a: any) => typeof a.name === 'string' && /^Fleuron_.+_universal\.dmg$/.test(a.name)
  );
  if (!macAsset) {
    throw new Error('Release validation failed: missing macOS DMG asset matching /^Fleuron_.+_universal\\.dmg$/');
  }

  const winAsset = assets.find(
    (a: any) => typeof a.name === 'string' && /^Fleuron_.+_x64-setup\.exe$/.test(a.name)
  );
  if (!winAsset) {
    throw new Error('Release validation failed: missing Windows EXE asset matching /^Fleuron_.+_x64-setup\\.exe$/');
  }

  const checksumsAsset = assets.find((a: any) => a.name === 'SHA256SUMS.txt');
  const checksumsUrl =
    checksumsAsset?.browser_download_url ||
    `${data.html_url || 'https://github.com/wilsonhyeh/fleuron/releases'}/download/SHA256SUMS.txt`;

  return {
    version,
    publishedAt,
    mac: {
      url: macAsset.browser_download_url,
      name: macAsset.name,
      size: macAsset.size,
      formattedSize: formatFileSize(macAsset.size),
    },
    win: {
      url: winAsset.browser_download_url,
      name: winAsset.name,
      size: winAsset.size,
      formattedSize: formatFileSize(winAsset.size),
    },
    checksumsUrl,
    releaseUrl: data.html_url || `https://github.com/wilsonhyeh/fleuron/releases/tag/${data.tag_name}`,
  };
}

let cachedRelease: ReleaseData | null = null;

export async function fetchLatestRelease(): Promise<ReleaseData> {
  if (cachedRelease) {
    return cachedRelease;
  }

  const url = 'https://api.github.com/repos/wilsonhyeh/fleuron/releases/latest';
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
    res = await fetch(url, { headers });
  } catch (err: any) {
    throw new Error(`Release validation failed: network fetch failed for ${url} (${err?.message || err})`);
  }

  if (res.status !== 200) {
    throw new Error(`Release validation failed: GitHub Releases API returned HTTP ${res.status} ${res.statusText}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch (err: any) {
    throw new Error(`Release validation failed: failed to parse JSON response (${err?.message || err})`);
  }

  cachedRelease = parseReleasePayload(data);
  return cachedRelease;
}
