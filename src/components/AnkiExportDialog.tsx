import { useMemo, useState } from 'react'
import { Download, FileText, X } from 'lucide-react'
import { Button } from './ui'
import { collectCards, downloadTsv, ANKI_IMPORT_INSTRUCTIONS, type ExportScope } from '../lib/ankiExport'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * Export-to-Anki dialog: review the cards selected for export, exclude
 * unwanted ones, see the count, download a UTF-8 TSV (Front/Back/Tags).
 * Cards come from the existing curriculum decks — nothing is generated.
 */
export default function AnkiExportDialog({
  scope,
  title,
  onClose,
}: {
  scope: ExportScope
  title: string
  onClose: () => void
}) {
  usePageMeta('Export to Anki')
  const cards = useMemo(() => collectCards(scope), [scope])
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const kept = cards.filter((c) => !excluded.has(c.cardId))

  const toggle = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export to Anki"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-line bg-surface shadow-lift">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold tracking-tight">Export to Anki — {title}</h2>
            <p className="mt-0.5 text-xs text-ink-faint">
              {kept.length} of {cards.length} cards selected · existing lesson cards, nothing generated
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">
              This scope has no authored cards yet — the review deck is the source, and it is empty here.
              Study the module and its cards will appear.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {cards.map((c) => {
                const on = !excluded.has(c.cardId)
                return (
                  <li key={c.cardId}>
                    <label
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        on ? 'border-line bg-surface' : 'border-dashed border-line opacity-55'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(c.cardId)}
                        className="mt-1 accent-[var(--accent)]"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{c.front}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-faint">
                          {c.moduleTitle} · {c.tags.join(' ')}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          <p className="text-[11px] leading-relaxed text-ink-faint">{ANKI_IMPORT_INSTRUCTIONS}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExcluded(new Set(cards.map((c) => c.cardId)))}
            >
              <X size={13} /> Exclude all
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={kept.length === 0}
                onClick={() => {
                  downloadTsv(kept, scope)
                  onClose()
                }}
              >
                <Download size={13} /> Download {kept.length} cards (.tsv)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Small trigger button reused on lesson + review pages. */
export function AnkiExportButton({
  scope,
  title,
  label = 'Export to Anki',
}: {
  scope: ExportScope
  title: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink"
      >
        <FileText size={12} /> {label}
      </button>
      {open && <AnkiExportDialog scope={scope} title={title} onClose={() => setOpen(false)} />}
    </>
  )
}
