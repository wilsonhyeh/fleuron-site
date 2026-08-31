import registry from './site-pages.json' with { type: 'json' };

export interface SitePage {
  path: string;
  title: string;
  description: string;
  label: string;
}

export const sitePages: readonly SitePage[] = registry;
export function pageFor(pathname: string): SitePage | undefined {
  const path = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
  return sitePages.find(page => page.path === path);
}
