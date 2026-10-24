import { useEffect } from 'react'

const SITE = 'Agent Academy'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Per-page document title + meta description + Open Graph tags (SPA-friendly).
 * Call once per page component with static strings.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} — Become an AI Agent Engineer`
    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:title', document.title)
      upsertMeta('property', 'og:description', description)
      upsertMeta('property', 'og:site_name', SITE)
    }
  }, [title, description])
}
