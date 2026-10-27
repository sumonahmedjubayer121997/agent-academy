// Build-time share-metadata prerendering.
// Client-side meta (usePageMeta) is invisible to social crawlers (WhatsApp,
// LinkedIn, Discord, Slack do not execute JS). This script emits static
// HTML files with correct OG/Twitter/canonical tags for the PUBLIC routes,
// derived from the roadmap registry — never hand-written. Vercel serves
// static files before the SPA rewrite, so crawlers get correct HTML.
//
// Run by the build chain: tsc && vite build && node scripts/prerender-share.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://agent-academy-peach.vercel.app'

// Registry import via vite-node-style loader is unavailable in plain node;
// read the registry through a tiny import of the compiled-adjacent sources.
// The registry is pure TS data — import it through vite's node ESM loader:
import { createServer } from 'vite'

const devServer = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true } })
const { ROADMAPS } = await devServer.ssrLoadModule('/src/content/roadmaps/registry.ts')
await devServer.close()

const ogFor = (slug) => `${SITE}/og/${slug ?? 'default'}.png`

const routes = [
  {
    file: 'index.html',
    path: '/',
    title: 'Agent Academy — structured roadmaps for AI skills',
    description:
      'Interactive learning roadmaps for AI Agents, Prompt Engineering, AI Programming, and Chatbot Development — lessons, spaced review, mastery gates, and portfolio projects.',
    image: ogFor('default'),
  },
  {
    file: 'roadmaps/index.html',
    path: '/roadmaps',
    title: 'Roadmaps · Agent Academy',
    description:
      'Structured, interactive roadmaps for AI skills. AI Agents is live; Prompt Engineering, AI Programming, and Chatbot Development are in public Beta.',
    image: ogFor('default'),
  },
  ...ROADMAPS.map((r) => ({
    file: `roadmaps/${r.slug}/index.html`,
    path: `/roadmaps/${r.slug}`,
    title:
      r.status === 'live'
        ? `${r.title} — ${r.tagline} · Agent Academy`
        : `${r.title} (${r.status === 'beta' ? 'Beta' : 'Coming soon'}) · Agent Academy`,
    description: r.description,
    image: ogFor(r.slug),
  })),
]

const dist = 'dist'
const template = readFileSync(join(dist, 'index.html'), 'utf-8')

for (const route of routes) {
  let html = template
  const url = `${SITE}${route.path}`

  const setMeta = (matcher, content) => {
    const tag = `<meta ${matcher} content="${content}">`
    const re = new RegExp(`<meta ${matcher.replace(/[-]/g, '\\-')}[^>]*>`)
    html = re.test(html) ? html.replace(re, tag) : html.replace('</title>', `</title>\n    ${tag}`)
  }
  const setLink = (rel, href) => {
    const tag = `<link rel="${rel}" href="${href}">`
    const re = new RegExp(`<link rel="${rel}"[^>]*>`)
    html = re.test(html) ? html.replace(re, tag) : html.replace('</title>', `</title>\n    ${tag}`)
  }

  html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
  setMeta('name="description"', route.description)
  setMeta('property="og:title"', route.title)
  setMeta('property="og:description"', route.description)
  setMeta('property="og:url"', url)
  setMeta('property="og:image"', route.image)
  setMeta('property="og:type"', 'website')
  setMeta('name="twitter:card"', 'summary_large_image')
  setMeta('name="twitter:title"', route.title)
  setMeta('name="twitter:description"', route.description)
  setMeta('name="twitter:image"', route.image)
  setLink('canonical', url)

  const outDir = join(dist, route.file.replace('/index.html', ''))
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  writeFileSync(join(dist, route.file), html)
  console.log(`prerendered ${route.path}`)
}
console.log(`share metadata prerendered for ${routes.length} routes`)
