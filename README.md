# منشئ السيرة الذاتية · CV Builder

A dependency-free, offline-first PWA that builds a professional CV from 14 templates.
Arabic-first (RTL native), with a full English/LTR mode. Your CV data runs entirely
on-device — no server, no account, no network call the app depends on.

> **One exception, stated plainly:** the optional voice assistant. It is off until you
> turn it on and agree to a consent prompt. While running, your microphone audio is
> streamed to ElevenLabs for processing. Your CV data is never sent — the assistant
> cannot read it. Nothing third-party is even downloaded until you opt in.

---

## Running it

Any static file server works. It **must** be served over `http://` or `https://` —
a `file://` page cannot register a service worker.

```bash
python -m http.server 5599 --directory cv-builder
```

Then open `http://localhost:5599`. Install it from the browser's install prompt,
or via **Settings → تثبيت التطبيق**.

To see every template at once while developing:
`http://localhost:5599/tools/gallery.html`

Regenerate the PWA icons (no dependencies — hand-rolled PNG encoder over Node's zlib):

```bash
node cv-builder/tools/make-icons.js
```

---

## Files

```
cv-builder/
├── index.html          shell: 5 views, bottom nav, bottom sheet
├── manifest.json       PWA manifest + 3 app shortcuts
├── sw.js               service worker — offline shell, font SWR, self-update
├── css/styles.css      design tokens, light/dark, RTL via logical properties
├── js/
│   ├── i18n.js         ar/en dictionaries; direction is a runtime property
│   ├── templates.js    the template engine (data -> appearance)
│   └── app.js          state, persistence, forms, preview, export
├── icons/              192 / 512 / maskable PNG + SVG
└── tools/
    ├── make-icons.js   zero-dependency PNG generator
    └── gallery.html    dev-only: all 14 templates side by side
```

---

## The biomimicry, and where it actually lives in the code

This is not decoration — each principle settled a real architectural decision.

### Cuttlefish → the template engine
*Sepia officinalis* keeps one unchanging body and repaints a thin, separately
controlled chromatophore layer in under a second (Hanlon & Messenger, *Cephalopod
Behaviour*, CUP 2018; Mäthger et al., *J. R. Soc. Interface* 6:S149, 2009).

So `renderCV(data, templateId)` is a **pure function**. A template owns no content
and can never mutate it; it only reads the one data core and paints a surface.
Switching template is a repaint, not a re-entry — which is precisely the coupling
that makes every other CV tool tedious.

### Weaver bird → the block vocabulary
*Ploceus* nests get their structural variety from one repeated stitch class.
All 14 layouts are assembled from a single small vocabulary — `blockEntries`,
`blockSkills`, `blockLangs`, `blockTags`, `blockRefs` — plus a config object.
Adding a template is ~1 line, not a new stylesheet. `toEntry()` normalises nine
different section types into one generic entry shape so the same block renders
all of them.

### Live template thumbnails — shadow DOM, not iframes
Every template card renders **your real CV**, scaled to card size, so choosing a
template is a direct comparison rather than a guess at a wireframe.

The obvious implementation — 14 iframes — means 14 documents, 14 style engines and
14 font contexts. Instead each card gets a **shadow root**: identical style
isolation, one document. `buildCVParts()` emits the same paint into either
container; `renderCV()` wraps it in a document for preview/print/export, while
`renderCVShadow()` targets `.doc` inside a shadow root (no `@import`, no `@page` —
the host page already carries all six fonts).

Three things keep it cheap:
- **Lazy**: an `IntersectionObserver` (240 px margin) mounts a card only once it is
  near the viewport — 9 of 14 on first paint, the rest on scroll.
- **Debounced**: edits repaint mounted cards on a 260 ms trailing debounce, so
  typing never drives 14 re-renders.
- **Contained**: `contain: content` stops thumbnail layout and paint from ever
  touching the page.

Measured: **63 ms to paint all 14**, 1,211 DOM nodes for the whole app.

Note that a shadow host does not render its own `::before`/`::after`, so card
framing lives on the parent, not the thumbnail.

### Honeybee → the entry format
The waggle dance compresses kilometres of foraging into a few seconds of angle and
duration, decodable by any nestmate without training (von Frisch, 1967).
`body()` turns free text into scannable bullets, and every entry renders as a fixed
head / sub / meta / detail signal — dense, conventional, parseable in one pass by a
human or an ATS.

### Tardigrade → the service worker
In anhydrobiosis a tardigrade replaces the water it depends on with a stable glass
and loses nothing while the environment is hostile (Boothby et al., *Molecular Cell*
65:975, 2017). At install, `sw.js` vitrifies the whole app shell into cache; state
lives in `localStorage`. Losing the network changes nothing about what the app can do.
And because a frozen cache would also freeze future releases, a newly installed
worker is waved through and the page reloads once — it molts rather than fossilises.

### Sunflower → direction
Heliotropism reorients the whole plant to where energy arrives from.
Direction here is a runtime property, not a translated afterthought: the CSS uses
only logical properties (`inset-inline-start`, `padding-inline`, `margin-inline`),
never `left`/`right`, so RTL and LTR are the same code path. The CV's own direction
is independent of the UI's — you can write an English CV in an Arabic interface.

### Nature's unifying patterns, as applied
- **Uses only the energy it needs** — no framework, no build step, no runtime
  dependency; the entire app is ~120 KB of source.
- **Locally attuned and responsive** — Arabic-first defaults, Arabic fonts, RTL
  by default, and a font stack that follows the language unless overridden.
- **Runs on information** — a single normalized state object is the only source of
  truth; everything else is derived.
- **Optimizes rather than maximizes** — uploaded photos are downscaled to 520 px
  so a whole CV still fits comfortably in `localStorage`.
- **Recycles all materials** — export/import round-trips the complete state as JSON,
  so nothing is trapped in the app.

---

## Features

- **14 templates** across 4 layout families (sidebar, band, split, timeline, stack)
  and 14 accent colours, each card showing a **live micro-preview of your actual CV**
  (see below), falling back to an abstract wireframe when you have not entered
  anything yet.
- **13 sections**: personal, objective, experience, education, skills, languages,
  projects, certifications, awards, volunteering, publications, interests,
  references — plus renameable custom sections.
- Reorder, hide, rename, duplicate; drag-and-drop on desktop, menu on mobile.
- **Format control**: font family (4 Arabic + 2 Latin), text/name/heading sizes,
  line spacing, section spacing, A4/Letter/Legal, margins, icons on/off,
  uppercase headings, independent CV direction.
- **Export**: PDF (via print), direct print, standalone HTML, Web Share, JSON backup.
- Autosave, completeness ring, sample data, light/dark, installable, offline.
- **Voice assistant** (optional, opt-in): an ElevenLabs conversational agent,
  lazy-loaded on demand at a pinned version so an upstream release cannot break the app.
- **Empty-state preview**: with nothing entered, an empty profile would render a
  technically-correct blank A4 — which reads as a broken app. Preview detects this
  and shows an explanation plus two ways out (fill in details / load sample), and
  disables Export and Format until there is something to export.

---

## Known limits

- PDF export goes through the browser's print dialog rather than a bundled PDF
  engine. That keeps the app dependency-free and the output vector-sharp, but the
  user picks "Save as PDF" themselves, and margin settings must stay at default
  in the print dialog for the template's own margins to be honoured.
- Fonts come from Google Fonts and are cached stale-while-revalidate. On a very
  first run with no network, the CV falls back to system fonts until fonts are
  fetched once.
- Page breaks are handled with `break-inside: avoid` on entries; there is no
  manual page-break control yet.
