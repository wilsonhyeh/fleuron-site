import type { APIRoute } from 'astro';
import { sitePages } from '../content/site-pages';

export const GET: APIRoute = ({ site }) => {
  const urls = sitePages.map(page => `  <url><loc>${new URL(page.path, site || 'https://fleuron.study')}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
