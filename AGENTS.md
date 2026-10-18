# AGENTS.md — TechFiyr website

Instructions for any AI coding agent (Claude Code, Cursor, Copilot, Codex, etc.) and any human contributor working on this repository. Read this whole file before you change anything.

TechFiyr is a mobile app and web software agency based in Mirpur DOHS, Dhaka, Bangladesh. This repo is the company's marketing website.

> **Non-negotiable: every page and every piece of content must be SEO, AEO and GEO optimised.**
> Whenever you add a page, a section, a project, a service, an FAQ, or change any copy, follow the workflow in **section 7.0** in the same change: Google Search, ChatGPT, Claude, Perplexity, Gemini and other AI crawlers must be able to find, read, understand and quote it. A change that skips this is not finished, even if it looks right in the browser.

---

## 1. Project at a glance

| Item | Value |
|---|---|
| Stack | **Next.js 16 (App Router) + React 19 + TypeScript**, every page prerendered to static HTML at build time. The design layer is unchanged: the template's own CSS (`public/assets/css`) and jQuery/vanilla behaviour scripts (`public/assets/js`, `public/assets/vendor`). Installable PWA with a service worker (`public/sw.js`). Netlify Functions power the visitor counter and the daily AI news schedule. A built-in CMS at `/admin` (section 7.8) manages the blog, products and AI news in Firestore. |
| Website root | `public/` holds static files served from the site root (`/assets/...`, `llms.txt`, `robots.txt`, `sw.js`). Pages live in `app/`. **Asset paths in this file (`assets/...`) are relative to `public/`.** |
| Base template | "iThub" multipurpose business HTML template, customised for TechFiyr |
| Hosting | Netlify with its Next.js runtime (`netlify.toml`: build, legacy redirects, cache headers). Netlify Forms for the booking form (declared in `public/__forms.html`). |
| Production domain | `https://techfiyr.com` (use it for canonical, Open Graph and JSON-LD URLs) |
| Pages (routes) | `/` `app/(site)/page.tsx`, `/projects`, `/projects/<slug>` (one static page per project), `/products`, `/products/<slug>`, `/blog`, `/blog/<slug>`, `/news` (CMS content, static pages refreshed on save), `/contact`, `/privacy-policy`, `/cookie-policy`, `/content-policy`, plus stand-alone `/coming-soon`, `/offline` (PWA fallback) and the 404 page (`app/not-found.tsx`). Old `.html` addresses 301-redirect to these. |
| Main stylesheet | `assets/css/style.css` (template CSS plus all TechFiyr additions at the end) and `assets/css/responsive.css` (template breakpoints), linked from `app/(site)/layout.tsx` |
| Third-party code | `assets/vendor/<library>/` (jQuery, Bootstrap CSS, GSAP, Swiper, WOW, Odometer, TypeIt, MeanMenu, jsVectorMap…). Never edit vendor files; list new ones in `THIRD_PARTY_NOTICES.md`. npm packages: only `next`, `react`, `react-dom` and TypeScript types. |
| Portfolio data | `lib/projects.ts` (single source of truth for projects) |
| Company facts | `lib/site.ts` (contact details, shared JSON-LD nodes, nav items, asset versions) |
| CMS content | Blog posts, products and AI news in Firestore, edited at `/admin` (section 7.8). Types in `lib/content.ts`, reads in `lib/server/content.ts`. |

### Repository layout

```text
app/                    Next.js routes
  layout.tsx            <html>/<body>, site-wide metadata, icons
  (site)/layout.tsx     template stylesheets, header, <main>, footer, template scripts
  (site)/**/page.tsx    pages with the header and footer
  not-found.tsx, offline/, coming-soon/   stand-alone pages (own inline styles from styles/)
  manifest.ts, sitemap.ts                 /manifest.webmanifest, /sitemap.xml
  admin/                the admin panel (CMS): login/, (panel)/ dashboard, blog, products, news; actions.ts
  api/news/refresh/     daily AI news refresh (called by netlify/functions/news-daily.mjs)
  media/[...path]/      /media/...: images uploaded in the admin panel
components/             Header, NavMenu, Footer, PageTitle, ProjectsGrid, ContentCards, JsonLd, SiteRuntime
  admin/                admin panel components (forms, Markdown editor, dashboard parts)
lib/                    site.ts (facts, nav, versions), seo.ts (metadata), projects.ts (portfolio),
                        content.ts (CMS types), markdown.tsx (Markdown to React)
  server/               server-only: store (Firestore / local files), auth + session, content reads,
                        news fetcher, dashboard data (insights), media uploads
proxy.ts                sends signed-out visitors from /admin to the login page
styles/                 CSS of the stand-alone pages only
public/                 static files served at the site root
  assets/css/           style.css, responsive.css (our styles)
  assets/js/            our scripts (template behaviour, consent, booking, visitors, analytics)
  assets/vendor/<lib>/  third-party libraries, untouched
  assets/fonts/         Font Awesome webfonts
  assets/images/        brand/ hero/ backgrounds/ services/ about/ team/ icons/ projects/<slug>/ og/
  sw.js                 service worker (PWA, offline)
  __forms.html          Netlify Forms registration (not a page)
netlify/functions/      serverless API (visitor counter)
scripts/                build scripts (run before `next build`)
.github/assets/         README artwork, not deployed
```

Rules: page markup goes in `app/` and `components/`; our CSS in `public/assets/css`; our browser scripts in `public/assets/js`; libraries in `public/assets/vendor/<name>/`; images in the folder for their purpose with lower-case, hyphenated, descriptive names (`team/saurav-wahid-portrait.jpg`, not `IMG_1234.jpeg`). Delete files that nothing references instead of leaving them in the repo.

### Commands

| Command | What it does |
|---|---|
| `npm install` | Install Next.js, React and TypeScript (Node 20.9+) |
| `npm run dev` | Development server on http://localhost:3000 (the service worker is off in development) |
| `npm run build` | Writes `public/firebase-config.js`, then builds and prerenders every page |
| `npm start` | Serves the production build locally (service worker on) |
| `npm run lint` | TypeScript check |
| `npm run server:start` / `server:stop` / `server:status` | Runs the server in the background (`scripts/server.sh`). `npm run server:start -- prod` builds first and serves the production build. Uses port 3000, or the next free port if it is taken. PID and log in `.server/` |

---

## 2. Hard rules: no agent default styling, no agent default code style

AI agents tend to produce a recognisable "default" look and code style. **None of it is allowed here.** All new work must look and read as if the original template author wrote it.

### Never introduce

- Tailwind, utility-class CSS frameworks, CSS-in-JS, CSS Modules, Sass/PostCSS, or UI component libraries (shadcn, MUI, Chakra, Radix themes…). Styling stays in the template's global `style.css`.
- Other frameworks or extra npm dependencies (Vue, Svelte, Alpine, animation or carousel packages, `next/font`, `next/image` for template images). The npm dependencies are `next`, `react`, `react-dom` and TypeScript types; anything else needs the owner's approval.
- New fonts: no `Inter`, `system-ui`, `-apple-system`, `Roboto`, `Geist`, or monospace UI text.
- New colours: no indigo/violet/purple/blue gradients, no slate/zinc greys, no `#6366f1`, `#8b5cf6`, `#3b82f6`, `#0f172a` and so on. Use only the tokens in section 4.
- Generic "SaaS landing page" patterns: glassmorphism hero cards, bento grids, pill badges with emoji, "✨" or any emoji used as icons, gradient text on every heading, centred 3-column feature grids with rounded-xl cards and soft shadows.
- Emoji as icons. Icons come from **Font Awesome 6** (already bundled), e.g. `<i class="fa-solid fa-check" aria-hidden="true"></i>`.
- New CSS reset, new `:root` palettes, new design-token files, or new global stylesheets.
- `<style>` blocks or `style` props in site pages. (The admin panel has its own stylesheet, `assets/css/admin.css`, with the site's tokens; its charts set bar sizes inline. Keep admin styles there, never in `style.css`.) The one existing exception is `style={{ backgroundImage: 'url(/assets/...)' }}` on template decoration/background elements; keep that pattern only for background images. (The stand-alone 404, offline and coming-soon pages carry their own inline CSS from `styles/` on purpose: they must render without the site stylesheets.)
- Placeholder copy such as "Lorem ipsum", "Acme Inc.", "John Doe", fake testimonials, fake statistics, or fake client logos.

### Code style to follow (match the existing files)

**Markup (TSX in `app/` and `components/`)**
- Indent with **tabs**, single quotes in TypeScript, double quotes in JSX attributes. Server components by default; add `'use client'` only for real interactivity (see `ProjectsGrid.tsx`, `NavMenu.tsx`).
- The markup is the template's HTML written as JSX (`className`, `htmlFor`, `style={{ backgroundImage: ... }}`). Keep it identical to the template patterns, including the whitespace between inline elements: JSX drops line breaks, so write `{' '}` where HTML had a space between inline or inline-block elements (buttons side by side, breadcrumb items, nav items). Missing spaces change the layout.
- Internal links use `next/link` (`<Link href="/contact">`) so pages are prefetched and open instantly; external, `mailto:` and `tel:` links stay `<a>`. Use clean URLs (`/contact`, `/projects/<slug>`), never `.html`.
- Images and assets use absolute paths (`/assets/images/...`), never relative ones.
- Keep the template's comment markers around every section: `{/* Contact Two */}` … `{/* End Contact Two */}`.
- Use the template's BEM-ish class naming: `block`, `block_element`, `block_element-part`, plus modifier classes like `style-two`, `light`, `centered` (e.g. `sec-title_heading`, `contact-info_block-inner`, `cta-one style-two`).
- Use Bootstrap grid and utility classes that are already in use (`row clearfix`, `col-lg-6 col-md-6 col-sm-12`, `d-flex`, `justify-content-between`, `align-items-center`, `flex-wrap`, `gap-3`, `ms-3`, `d-none d-md-inline-flex`).
- JS hooks use `data-*` attributes (`data-booking-form`, `data-projects-grid`), not ids or styling classes.

**CSS**
- Add new rules **only at the end of `assets/css/style.css`**, inside a section banner in the existing format:

  ```css
  /* ==========================================================================
     Services detail page (/services)
     ========================================================================== */
  ```

- 2-space indentation inside `style.css` rules, one property per line, lower-case hex, `0` without units where the file already does so.
- Use the existing variables (`var(--main-color)`, `rgba(var(--main-color-rgb), 0.15)`, `var(--black-color)`, `var(--white-color)`) instead of hard-coded values.
- Reuse existing component classes before writing new ones. If you need a variant, add a modifier class (`.cta-one.style-three`), do not fork the component.
- Breakpoints: `max-width: 991.98px` (tablet) and `max-width: 767.98px` (mobile) for new code; the template also uses 1199/599/479px in `responsive.css`.
- Wrap any new animation or transition in a `@media (prefers-reduced-motion: reduce)` override.

**TypeScript (app code)**
- Strict TypeScript, function components, named types for data (`Project` in `lib/projects.ts`). Facts, URLs and versions come from `lib/site.ts`; never hard-code them in pages.
- Header comment at the top of every new file explaining what it is for and where its data comes from.
- Render data with JSX (React escapes it). `dangerouslySetInnerHTML` only for JSON-LD (`components/JsonLd.tsx`) and the stand-alone pages' CSS.

**Browser scripts (`public/assets/js`)**
- ES5, inside an IIFE with `'use strict';`, `var`, `function` declarations, tabs. See `assets/js/booking.js`.
- They must never change the HTML before React hydrates it. Template behaviour goes in `script.js`: once-per-visit work (header, mobile menu, footer) in `initOnce()`, per-page widgets in `initPage(path)` with cleanup in `destroyPage()`. `components/SiteRuntime.tsx` calls `window.TechFiyr.mount(pathname)` after hydration and after every client-side page change. A page widget in its own file exposes an init function (`window.TechfiyrBooking`) that `initPage` calls, and guards against running twice on the same DOM.
- jQuery is available; new page-specific widgets may be vanilla JS like `booking.js`.
- Escape any data inserted into HTML.
- No external API calls, trackers or ad scripts without the owner's approval.

**Cache busting (mandatory)**
- `netlify.toml` caches `/assets/*` for one year. Every time you change a CSS or JS file in `public/assets`, bump its version in `ASSET_VERSION` in `lib/site.ts` (format `YYYYMMDD` or `YYYYMMDD.N`); every page picks it up from there. Next.js's own files (`/_next/static/*`) are content-hashed and need nothing.
- When you change the caching rules in `public/sw.js`, bump its `VERSION` so old caches are cleared.
- A changed image must get a **new file name**; otherwise visitors keep the old one for up to a year.

---

## 3. Design concept (do not change)

The design concept is fixed. New pages and sections extend it; they never redesign it.

- **Fresh green identity**: a deep forest green (`#237A57`) flowing into a lime (`#C6E45A`) through a 90° gradient. This gradient is the brand signature (buttons, preloader, section-title dots, carousel arrows).
- **Very round, soft geometry**: pill buttons (50px radius), 50px rounded hero/page-title frame inset 20px from the viewport, 150px radius on CTA bars and service cards, circular icon holders.
- **High contrast blocks**: white content sections alternate with near-black (`#191919` / black-to-`#222` gradient) feature blocks and footer.
- **Navy photo overlay** (`#00022A` at 70% opacity) on page-title background images, with a giant outlined (text-stroke) word behind the title.
- **Section title pattern**: small uppercase green eyebrow flanked by three animated gradient dots, then a large Outfit heading.
- **Motion**: two-line text swap on button hover, WOW/GSAP reveals, marquee band, odometer counters, back-to-top progress ring.
- **Marketplace trust**: Fiverr green (`#1DBF73`) is used only for Fiverr/Upwork trust badges and review tags, never as a general UI colour.

Do not change existing pages' layout, colours, typography, spacing or animations unless the owner explicitly asks. Fixing an accessibility or SEO defect (section 6 and 7) is allowed as long as it does not change the visual design.

---

## 4. Design tokens

### 4.1 Colours

Defined in `:root` at the top of `style.css`:

| Token | Hex | Role | Contrast on white |
|---|---|---|---|
| `--main-color` | `#237A57` | Primary brand green: links, eyebrows, icons, focus, accents | 5.26:1 ✔ AA text |
| `--color-two` | `#C6E45A` | Lime accent: gradient end, CTA border, highlights | 1.43:1 ✘ **never text on light bg** (12.26:1 on `#191919` ✔) |
| `--color-three` | `#DDDDDD` | Borders, scrollbar hover, outlined big-title stroke | decorative only |
| `--color-four` | `#F2F2F2` | Light section background | `#237A57` on it: 4.70:1 ✔ |
| `--white-color` | `#FFFFFF` | Page background, text on dark | — |
| `--black-color` | `#191919` | Headings, dark sections | 17.58:1 ✔ |

Each has an `-rgb` twin for alpha use: `rgba(var(--main-color-rgb), 0.15)`.
Note: `--color-two-rgb` is wrongly set to `193, 21, 236` (a template leftover). Do not use it; write `198, 228, 90` until it is corrected.

Supporting colours already in use:

| Hex | Use |
|---|---|
| `#666666` | Body copy (5.74:1 ✔) |
| `#555F59` | Long-form body copy on project pages |
| `#6B7A72` | Secondary/muted text (4.51:1, the lowest allowed for normal text) |
| `#00022A` | Navy overlay on page-title photos (70% opacity) |
| `#000000` → `#222222` | Footer background gradient (180°) |
| `#F6F7F8` | Testimonial panel background |
| `#FFFFFF` → `#DFF8FF` | CTA bar background gradient (90°) |
| `#1DBF73` / `#0C7C44` / `#00B074` | Fiverr badge colours. Fiverr green text on white is only 2.4:1, so use `#0C7C44` for small text |
| `#FFBE0B` | Rating star |

**Brand gradient**

```css
background-color: rgba(35, 122, 87, 1);
background-image: linear-gradient(90deg, rgba(35, 122, 87, 1) 0%, rgba(198, 228, 90, 1) 100%);
```

Hover state reverses it (lime → green). Vertical variant: `linear-gradient(180deg, #237A57, #C6E45A)` or `0deg` for the dots.
Soft tinted panel: `linear-gradient(180deg, rgba(var(--main-color-rgb), 0.06), rgba(198, 228, 90, 0.08))`.

### 4.2 Typography

Loaded from Google Fonts in every page `<head>` (keep these three links exactly):

| Family | Role |
|---|---|
| **Outfit** (100–900) | All headings `h1`–`h6`, weight 700 |
| **Manrope** (300–800) | Body, buttons, forms, UI text |
| **Raleway** (100–900) | Giant outlined decorative words (`.page-title_big-title`, `sec-title_big-title`), weight 800, uppercase, transparent fill with 1px stroke |

Type scale (desktop; `responsive.css` scales it down):

| Element | Size / line-height |
|---|---|
| `h1` | 72px / 86px |
| `h2` | 60px / 70px |
| `.sec-title_heading` | 48px / 58px, capitalize |
| `h3` | 32px / 42px |
| `h4` | 26px / 34px |
| `h5` | 20px / 30px |
| `h6` | 18px / 28px |
| `p`, `.text` | 16px / 1.7em, `#666666` |
| Long-form `p` (project pages) | 17px / 1.8 |
| `.sec-title_title` eyebrow | 18px, 700, uppercase, `--main-color` |
| Buttons | 15px, 700, Manrope, capitalize |
| Breadcrumb | 18px, 500, uppercase |

### 4.3 Shape, depth, layout

| Token | Value |
|---|---|
| Container | `.auto-container` max-width 1320px, 15px side padding (`.auto-container_two` = 1200px) |
| Radius | 50px (buttons, page-title frame, footer), 28px (large cards, booking widget, hero images), 20–24px (cards, galleries, aside panels), 150px (CTA bar, service cards), 50% (icons, avatars) |
| Shadows | Large card: `0 30px 70px rgba(var(--black-color-rgb), 0.08)`; image: `0 30px 80px rgba(var(--black-color-rgb), 0.15)`; gallery: `0 18px 50px rgba(var(--black-color-rgb), 0.08)`; green glow: `0 4px 12px rgba(35, 122, 87, 0.25)` |
| Section spacing | ~120px top/bottom on desktop, 70–80px on mobile |
| Transitions | `all 0.3s ease` (links, buttons), 800ms for button fill sweep, 0.4s for card lift (`translateY(-8px)`) |

---

## 5. Building a new page

Create `app/(site)/<route>/page.tsx`, copying an existing inner page (`contact/page.tsx` or `projects/page.tsx` is the best starting point). The layout `app/(site)/layout.tsx` already provides the stylesheets, skip link, preloader, header, `<main id="main">`, footer, back-to-top ring and scripts. Never hand-write a header or footer.

### 5.1 Required page skeleton

1. `export const metadata = pageMetadata({ title, description, path })` from `lib/seo.ts` (section 7.1).
2. `<JsonLd data={...} />` with the page's structured data (section 7.2).
3. `<PageTitle bigTitle="..." title="..." crumbs={[...]} />`: outlined word, the page's single `<h1>`, breadcrumb.
4. Content sections built from existing components (5.2).
5. `section.cta-one.style-two` call to action before the footer when it fits.
6. If the page needs template behaviour (a slider, a counter), add it to `initPage()` in `public/assets/js/script.js` so it starts on client-side navigation too.

### 5.2 Reusable components (use these, don't reinvent)

| Need | Component |
|---|---|
| Section heading | `.sec-title` (+ `.centered`, `.light` on dark bg) with `.sec-title_title` + `.sec-title_dots` ×2 + `h2.sec-title_heading` + optional `.sec-title_text` |
| Primary button | `a.theme-btn.btn-style-one > span.btn-wrap > span.text-one + span.text-two` (same label twice) |
| Service cards | `.offer-one` / `.offer-block_one` |
| About / image + text | `.about-one` |
| Stats / counters | `.achieve-one` with odometer |
| Steps | `.process-one` |
| Team | `.team-one` |
| Reviews | `.testimonial-one` (real Fiverr/Upwork reviews only) |
| Marquee band | `.marketing-one` |
| CTA bar | `.cta-one.style-two` |
| Form | `.contact-form` with `.form-group` fields, Netlify Forms (`data-netlify="true"`, honeypot) |
| Contact details | `.contact-info_box` / `.contact-info_block` |
| Portfolio | `.projects-section`, `.projects-grid`, `.project-hero`, `.project-body`, `.project-gallery` |
| Map | `.map-one` with a titled `<iframe>` |

When you add a page, also: add it to `NAV` in `lib/site.ts` if it is a top-level page, add it to `app/sitemap.ts`, add it to `PRECACHE_PAGES` in `public/sw.js` if it should open offline on a first visit, and add internal links to it from relevant existing sections.

---

## 6. Accessibility (WCAG 2.2 AA is mandatory on every page)

### Required on every new or edited page

- `<html lang="en">`, a unique descriptive `<title>`, and `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (never disable zoom).
- A skip link as the first focusable element and `<main id="main">`: both come from `app/(site)/layout.tsx` (`.skip-link` style at the end of `style.css`). Don't add a second `<main>` inside a page.
- Landmarks: `header`, `nav` (with `aria-label` if more than one), `main`, `footer`.
- **Exactly one `<h1>` per page**, then headings in order with no skipped levels. Decorative big words (`page-title_big-title`, marquee text) must not be heading elements and should have `aria-hidden="true"`.
- Text contrast ≥ 4.5:1 (≥ 3:1 for 24px+ or 18.66px+ bold text, icons and UI borders). Use the contrast column in section 4.1. Never put `#C6E45A` text on light backgrounds, and never put small white text on the lime end of the gradient.
- Every interactive element is a real `<a href>` or `<button type="button">`, never a clickable `div`/`span`. Icon-only controls need `aria-label`.
- Visible focus: a `:focus-visible` outline of at least 2px in `--main-color` (or white on dark backgrounds) with `outline-offset: 3px`. Never use `outline: none` without a replacement.
- Icons from Font Awesome are decorative: add `aria-hidden="true"`. If the icon carries meaning, add visually hidden text (`<span class="sr-only">…</span>`; `.sr-only` already exists in `style.css`).
- Images: meaningful `alt` describing content; decorative images (arrows, shapes, quote marks) use `alt=""`. Always set `width` and `height` (prevents layout shift), and `loading="lazy"` below the fold.
- Forms: every field has a `<label>` (visually hidden is fine; placeholder alone is not a label), correct `type` and `autocomplete`, `required` with a visible indication, errors announced via `aria-live="polite"` and linked with `aria-describedby`.
- Links that open a new tab (`target="_blank"`) keep `rel="noopener"` and say so to screen readers: `<span class="sr-only">(opens in a new tab)</span>`.
- Respect `prefers-reduced-motion`: disable marquee, parallax, WOW/GSAP reveals, animated dots and the preloader animation for those users. Content must never be hidden permanently behind a JS animation.
- Touch targets at least 24×24px (aim for 44×44px on mobile). No horizontal scroll at 320px wide. Content must work at 200% zoom.
- Carousels (Swiper) need visible prev/next buttons with labels and must not autoplay for users with reduced motion, or must have a pause control.
- Embedded iframes have a `title`.
- Use `aria-current="page"` on the active nav link and the last breadcrumb item.

### Known accessibility debt in existing pages (fix without changing the look, when you touch that area)

- `.mobile-nav-toggler` and `.mobile-menu .close-btn` are `div`s. Change them to `<button type="button">` with `aria-label`, `aria-expanded` and `aria-controls`.
- Decorative images use `alt="Arrow"`, `alt="Quote"`, `alt="Handshake"`. Change to `alt=""`.
- Form fields on the contact page (`app/(site)/contact/page.tsx`) use placeholders without labels.
- `.btn-style-one` has white text over the green→lime gradient; around the lime end, contrast drops below 3:1. When restyling is approved, darken the gradient end behind text or add a text shadow. Do not do this without the owner's approval, because it is a design change.
- `assets/images/background/page-title-1.png` is referenced by inner pages but does not exist.

---

## 7. SEO, AEO and GEO (mandatory on every page)

- **SEO**: classic search ranking.
- **AEO** (answer engine optimisation): being the answer in featured snippets, People Also Ask and voice assistants.
- **GEO** (generative engine optimisation): being cited correctly by ChatGPT, Gemini, Perplexity, Claude and Google AI Overviews.

All three come from the same base: clear facts, structured data, and crawlable HTML.

### 7.0 Workflow: run this for every new page and every content change

**A. Before writing: plan the page around a search question**

1. Pick **one primary query** the page should rank and be cited for, phrased the way a client would type or ask it (e.g. "Flutter app development company in Bangladesh", "how much does a Flutter app cost"). Add 3–5 related secondary queries.
2. Check that no existing page already targets the same query. If one does, improve that page instead of creating a competing one.
3. Decide the search intent (learn, compare, hire, contact) and make the page answer exactly that.
4. Choose a short, lower-case, hyphenated route that contains the main keyword (`/flutter-app-development`, file `app/(site)/flutter-app-development/page.tsx`).

**B. While writing: on-page SEO, AEO and GEO**

1. **Title** (≤ 60 chars, primary query first, `| TechFiyr` last), **meta description** (150–160 chars with a proof point), **`<h1>`** and **URL** all target the same primary query, worded naturally.
2. **Answer first**: the first paragraph under the `<h1>`, and under every `<h2>`, is a direct 40–60 word answer that can be quoted on its own. Then add detail.
3. Phrase `<h2>`/`<h3>` headings as the questions people ask, covering the secondary queries.
4. Use **specific, verifiable facts**: tech names (Flutter, React Native, Next.js, Codemagic), numbers that already appear on the site (20 clients, 5.0 Fiverr rating, 2+ years), real project names, real locations. Never invent stats, clients or reviews.
5. Use the right semantic HTML: lists, `<table>` for comparisons and pricing, `<dl>` for specs, `<figure>`/`<figcaption>`, `<time datetime>`, `<address>`.
6. Add a visible **FAQ** of 3–6 real questions on service, pricing and contact pages, and mark it up with `FAQPage`.
7. **Internal links**: link **to** the new page from at least 2 relevant existing pages or sections, and **from** it to at least 2 related pages (a service, a project, contact). Use descriptive anchor text.
8. **Images**: descriptive file name, meaningful `alt`, compressed, `loading="lazy"` below the fold. Add a 1200×630 OG image in `assets/images/og/` for important pages.
9. Keep company facts (name, address, phone, email, founder, rating) **identical** to `lib/site.ts`, the home page JSON-LD (`app/(site)/page.tsx`) and `llms.txt`.

**C. Head and structured data (section 7.1 and 7.2)**

1. `metadata` from `pageMetadata()` (section 7.1): canonical, robots, Open Graph, Twitter, `llms.txt` alternate link.
2. `<JsonLd>` with a JSON-LD `@graph` of the page type (`WebPage`, `Service`, `ContactPage`, `CollectionPage`, `Article`, `FAQPage`), the shared `ProfessionalService` node (`orgNode` in `lib/site.ts`), and `BreadcrumbList` on inner pages (`breadcrumbNode()`). Everything in it must be visible on the page.

**D. Discovery files: update in the same change**

1. `app/sitemap.ts` (served as `/sitemap.xml`): add the URL (with its main images) and set its date to today. When you edit an existing page's content, update its date too. Projects are added automatically from `lib/projects.ts`.
2. `llms.txt`: add the page under **Pages** (or **Projects**/**Services**) with a one-line summary. Update any changed facts.
3. `robots.txt`: no change normally. Never block a public page; use `noindex` for pages that must stay out of results.
4. New project: also follow the project steps in section 7.4.

**E. Before you finish: verify**

1. **Read the page without JavaScript** (view-source or disable JS): the `<h1>`, main copy and links must be in the HTML.
2. JSON-LD parses and passes the Schema.org validator and Google Rich Results Test.
3. Lighthouse (Chrome DevTools) scores 100 for SEO and at least 90 for Accessibility and Best Practices on mobile.
4. Exactly one `<h1>`, no broken links, and no duplicate title or description across the site.

**F. After deploy (tell the owner if you can't do it yourself)**

1. Google Search Console: inspect the new URL and request indexing; resubmit `sitemap.xml` if it changed.
2. Bing Webmaster Tools: submit the URL. Bing powers ChatGPT search and Copilot.
3. Ask ChatGPT, Claude and Perplexity the page's primary query a few weeks later and note whether TechFiyr is cited.

### 7.1 Required head metadata for every indexable page

Pages don't write `<head>` tags by hand: Next.js renders them from the page's `metadata` export. Use the helper in `lib/seo.ts`, which produces the full set (title, description, canonical, robots, Open Graph, Twitter card, the `llms.txt` alternate link):

```tsx
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
	title: 'Primary Keyword Phrase | TechFiyr',
	description: '150–160 characters: what the page offers, for whom, and one proof point.',
	path: '/page-name',
	// optional: ogTitle, ogDescription, twitterDescription, image: { url, width, height, alt }
});
```

For a page generated per item (projects), export `generateMetadata` instead (see `app/(site)/projects/[slug]/page.tsx`). Icons, the manifest link and the theme colour come from `app/layout.tsx`; stylesheets and fonts from `app/(site)/layout.tsx`.

Rules:
- `<title>` ≤ 60 characters, unique, primary keyword first, brand last (`… | TechFiyr`).
- Meta description 150–160 characters, unique, no keyword stuffing. Do not add `meta keywords` to new pages (search engines ignore it).
- Canonical URLs are absolute, use `https://techfiyr.com` and the clean path (`/contact`, never `.html`).
- OG images are 1200×630 JPG/WebP under `assets/images/og/`.
- Pages that should not be indexed (coming soon, offline, thank-you pages, 404) export `robots: NOINDEX` from `lib/seo.ts` and are left out of `app/sitemap.ts`.

### 7.2 Structured data (JSON-LD)

Use JSON-LD only, never microdata, rendered with `components/JsonLd.tsx` at the top of the page component (it is in the server HTML, so crawlers that don't run JavaScript read it). The data must match visible page content exactly; never mark up content the user can't see.

- **Every page**: `Organization` (or `ProfessionalService`) with the same `@id` (`https://techfiyr.com/#organization`), plus `WebSite` on the homepage and `BreadcrumbList` on inner pages.
- **Service pages**: `Service` with `provider` → `{"@id": "https://techfiyr.com/#organization"}`, `serviceType`, `areaServed`.
- **Project pages**: `CreativeWork` (or `SoftwareApplication` for shipped apps) with name, description, image, URL.
- **FAQ sections**: `FAQPage`, only when the Q&A is visible on the page.
- **Blog/insights**: `Article` with `author` (a real person), `datePublished`, `dateModified`.
- **Contact page**: `ContactPage`.

Canonical organisation facts (keep identical everywhere: page copy, JSON-LD, footer, `llms.txt`):

```json
{
	"@context": "https://schema.org",
	"@type": "ProfessionalService",
	"@id": "https://techfiyr.com/#organization",
	"name": "TechFiyr",
	"url": "https://techfiyr.com/",
	"logo": "https://techfiyr.com/assets/images/brand/logo.svg",
	"email": "info@techfiyr.com",
	"telephone": "+8801540659530",
	"address": {
		"@type": "PostalAddress",
		"streetAddress": "325, Mirpur DOHS",
		"addressLocality": "Dhaka",
		"postalCode": "1216",
		"addressCountry": "BD"
	},
	"areaServed": ["United States", "Europe", "Asia"],
	"knowsAbout": ["Mobile app development", "Flutter", "React Native", "iOS", "Android", "Custom web software", "SaaS", "UI/UX design", "CI/CD", "Codemagic"],
	"sameAs": [
		"https://github.com/techfiyr",
		"https://www.fiverr.com/wahidsaurav",
		"https://www.upwork.com/freelancers/sauravwahid"
	]
}
```

Validate with the Schema.org validator and Google Rich Results Test before shipping.

### 7.3 Content rules for AEO and GEO

- Lead each section with a direct, 40–60 word answer to the question the section addresses, then expand. Headings phrased as the questions people ask ("How much does a Flutter app cost?") help answer engines.
- Use real, specific, verifiable facts: services, tech stacks, timelines, locations, real project names from `projects-data.js`, real review counts and ratings. Name things precisely ("Flutter", "React Native", "Codemagic CI/CD") rather than vaguely.
- Keep entity facts consistent (company name, address, phone, founder, rating) across every page, so AI systems can trust them.
- Use semantic HTML: lists for lists, `<table>` for comparisons, `<dl>` for spec sheets, `<figure>`/`<figcaption>` for screenshots, `<time datetime="">` for dates, `<address>` for contact details.
- Add a short visible FAQ (3–6 real questions) on service and contact pages, marked up with `FAQPage`.
- Show authorship and freshness on articles: author name with role, published/updated dates.
- Never hide text for search engines, never stuff keywords, never write fake reviews or statistics.

### 7.4 Crawlability and performance

- All content must be in the HTML, not only rendered by JavaScript. Most AI crawlers do not run JS.
- **Projects are static pages**: `/projects` lists them and `/projects/<slug>` is prerendered for every entry in `lib/projects.ts`, with its title, description, canonical, OG tags, `<h1>` and JSON-LD in the server HTML. The sitemap and the `ItemList` JSON-LD on `/projects` update themselves. For each new project also add it to the Projects section of `llms.txt`.
- Maintain `app/sitemap.ts` (every indexable page, absolute URLs, dates) and `public/robots.txt` (`Sitemap: https://techfiyr.com/sitemap.xml`; allow AI crawlers such as `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` unless the owner says otherwise).
- Maintain `public/llms.txt`: a short Markdown summary of who TechFiyr is, services, contact details, and links to key pages.
- Descriptive internal link text ("See our Flutter projects", not "click here").
- Clean, lower-case, hyphenated routes (`/mobile-app-development`).
- Images: compressed WebP/JPG, explicit `width`/`height`, `loading="lazy"` below the fold, `fetchpriority="high"` on the hero/LCP image only. Descriptive file names.
- Keep Core Web Vitals healthy: no new render-blocking third-party scripts, no layout shift from late-loading content, `font-display: swap` (already in the Google Fonts URLs).
- **Performance rules (keep them):**
  - Every page is prerendered (static HTML from the CDN) and internal links use `next/link`, which prefetches pages as they scroll into view, so navigation is instant. Don't make a page dynamic (cookies, headers, uncached fetches) without a reason.
  - The header, footer and scripts stay loaded between pages; the template scripts are `defer` and start after hydration (`components/SiteRuntime.tsx`).
  - The `.preloader` hides on DOM ready (`script.js`), with a CSS fallback after 2.5s, and only shows on the first page of a visit. Never tie it to `window.load` again; that made visitors stare at the gradient until every image had downloaded.
  - Load Google Fonts with the single combined URL used on every page (`Manrope 300..800`, `Outfit 100..900`, `Raleway 800`). Don't add separate font links or unused weights.
  - Every `<img>` below the fold gets `loading="lazy" decoding="async"`; the header logos and the hero don't.
  - Preload the LCP image when it's a CSS background (see `preload()` in `app/(site)/page.tsx`).
  - Resize photos to the size they display at (about 2× the card width, e.g. ≤ 640px for team photos) and compress them (JPEG quality ~82, progressive) before committing.
- Every page must remain usable with JavaScript disabled for its core text and links.

### 7.7 PWA, service worker and offline

| Piece | File | Notes |
|---|---|---|
| Manifest | `app/manifest.ts` → `/manifest.webmanifest` | Name, colours, icons (`assets/images/brand/app-icon-*.png`, maskable variant), shortcuts. |
| Service worker | `public/sw.js` (registered in production by `components/SiteRuntime.tsx`) | Cache first for `/_next/static/*`, `/assets/*` and Google Fonts; network first (3s timeout, then the saved copy) for pages and Next.js page data; never touches `/api/*`, analytics, maps or other sites. Precaches `/`, `/projects`, `/contact`, `/offline`. |
| Offline page | `app/offline/page.tsx` | Shown for pages that aren't saved yet when there is no connection. Stand-alone styles, noindex. |

Rules: bump `VERSION` in `sw.js` when its caching rules change. Never cache POST requests, `/api/*` or anything personal. A new consent-gated third-party service must not be cached by the worker.

### 7.6 Firebase, Google Analytics and the visitor counter

| Piece | File | Notes |
|---|---|---|
| Netlify build | `netlify.toml`, `scripts/build-config.mjs` | `npm run build` first runs `prebuild`, which writes `public/firebase-config.js` (git-ignored, served at `/firebase-config.js`) from env vars. Missing vars → `window.TECHFIYR_FIREBASE = null`, analytics off. |
| Google Analytics 4 | `assets/js/analytics.js` | Loads Firebase Analytics (SDK 13.0.0 from gstatic) **only after "analytics" consent**; sets `ga-disable-<ID>` and deletes `_ga` cookies when consent is withdrawn. |
| Visitor counter API | `netlify/functions/visits.mjs` → `/api/visits` | No npm dependencies. POST counts a **unique visitor per day** (HMAC of IP + user agent with a daily key, stored in `uniques/{day}-{hash}` with `expireAt`), GET returns totals from `stats/visits`. Only counts browsers on our own origins, skips bots. GET is edge-cached 60s. On failure it returns `{ step, status, detail }` so the cause shows in the browser's Network tab and in Netlify function logs. |
| Footer counter + map | `assets/js/visitors.js`, `assets/vendor/jsvectormap/` (v1.7.0, MIT) | Counts a visit only on arrival from another site or a typed URL (not reloads or internal clicks). No cookies or storage. Map library loads when the footer is near view. Block stays hidden if the API fails. |

**Netlify environment variables** (Site configuration → Environment variables). Never commit their values.

| Key | Scope | Secret? | Value |
|---|---|---|---|
| `FIREBASE_API_KEY` | Builds | No (public web config) | from Firebase console → Project settings → Your apps |
| `FIREBASE_AUTH_DOMAIN` | Builds | No | ″ |
| `FIREBASE_PROJECT_ID` | Builds, Functions | No | ″ |
| `FIREBASE_STORAGE_BUCKET` | Builds | No | ″ |
| `FIREBASE_MESSAGING_SENDER_ID` | Builds | No | ″ |
| `FIREBASE_APP_ID` | Builds | No | ″ |
| `FIREBASE_MEASUREMENT_ID` | Builds | No | ″ (`G-…`) |
| `FIREBASE_CLIENT_EMAIL` | Functions | **Yes** | `client_email` from the service-account JSON |
| `FIREBASE_PRIVATE_KEY` | Functions | **Yes** | `private_key` from the service-account JSON |

Rules:
- The Firebase **web** config is public by design (it ships to every browser). Protect it by restricting the API key to `techfiyr.com/*`, `*.techfiyr.com/*` and `techfiyr.netlify.app/*` (Google Cloud Console → APIs & Services → Credentials). Don't mark the public vars as secret, or Netlify's secret scanning fails the build when they appear in `firebase-config.js`.
- The **service account** key is a real secret: Functions scope only, marked secret, never in the repo or in browser code.
- Firestore security rules must deny all client access (`allow read, write: if false;`); only the function writes, using the service account.
- Firestore TTL policy (Firestore → TTL): collection group `uniques`, field `expireAt`. It deletes the daily visitor hashes after two days, as the Privacy Policy promises.
- Local preview has no `/firebase-config.js` or `/api/visits`: analytics stays off and the footer counter stays hidden. Use `netlify dev` with a local `.env` (git-ignored) to test them.

### 7.8 Admin panel (CMS): blog, products, AI news

| Piece | File | Notes |
|---|---|---|
| Admin panel | `app/admin/` | `/admin/login`, then dashboard, Blog, Products, AI news. Own stylesheet `assets/css/admin.css` (site tokens, no template CSS/JS). noindex, never cached (`proxy.ts`), disallowed in `robots.txt`, skipped by the service worker. |
| Sign-in | `lib/server/auth.ts`, `lib/server/session.ts` | Firebase Authentication email/password, checked server-side; only addresses in `ADMIN_EMAILS`. Session: signed HttpOnly cookie `tf_admin` (12 h, listed in the Cookie Policy). Every page and server action checks it. Nobody can register. |
| Content store | `lib/server/store.ts` | Firestore REST with the service account: collections `posts`, `products`, `news`, `meta`. Without credentials in development: JSON files in `.data/` (git-ignored). |
| Public pages | `app/(site)/blog`, `products`, `news` | Static, cached with tags `posts`/`products`/`news`; the admin actions call `updateTag` + `revalidatePath`, so a save is live on the next visit. New slugs render on first visit. Sitemap updates itself. |
| Images | `lib/server/media.ts`, `app/media/[...path]/route.ts` | Uploaded to the private Firebase Storage bucket, served from `/media/...` (first party, one-year cache, unique names). Max 5 MB. |
| AI news | `lib/server/news.ts`, `netlify/functions/news-daily.mjs`, `app/api/news/refresh/route.ts` | Every day 00:30 UTC (06:30 Dhaka): reads the AI feeds in `FEEDS`, picks the top 10 (last 36 h, max 2 per publisher, duplicates merged, nothing repeated from earlier days), keeps 30 days. Publishes only headline, publisher, date, the feed's summary and a link; never article text or publisher images. Add or remove sources in `FEEDS` (check the feed URL returns RSS/Atom). |
| Dashboard | `lib/server/insights.ts` | Visitors (Firestore `stats/visits` + `stats/daily-YYYY-MM`), Search Console performance and URL Inspection per sitemap URL, GA4 report, IndexNow status. Each source is optional and shows its own setup steps. |
| IndexNow | `lib/server/insights.ts`, `app/indexnow-key.txt/route.ts` | Publishing, updating or deleting pings Bing/Yandex/Seznam/Naver with the changed URLs (production only). |

**Environment variables for the CMS** (in addition to section 7.6; scope Functions unless noted):

| Key | Secret? | Value |
|---|---|---|
| `ADMIN_EMAILS` | No | The admin's email address (comma-separate several) |
| `SESSION_SECRET` | **Yes** | 32+ random characters (`openssl rand -base64 48`) |
| `CRON_SECRET` | **Yes** | 24+ random characters; the daily news job sends it |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | as 7.6 | Give them the **Builds** scope too (keep the key marked secret), so `npm run build` prerenders the blog, products and news with real content; otherwise those pages start empty after each deploy until the first save or for up to an hour |
| `FIREBASE_API_KEY` | No | Also needed in the Functions scope (password check) |
| `FIREBASE_STORAGE_BUCKET` | No | Also needed in the Functions scope (uploads) |
| `GSC_SITE_URL` | No | `sc-domain:techfiyr.com` (domain property) or `https://techfiyr.com/` |
| `GA4_PROPERTY_ID` | No | GA4 property ID, digits only |
| `INDEXNOW_KEY` | No | 32 random letters/digits; served at `/indexnow-key.txt` |

**One-time setup:**
1. Firebase console → Authentication → Sign-in method: enable Email/Password. Users → Add user with the admin email and a strong password. Put that email in `ADMIN_EMAILS`.
2. Firebase console → Storage: create the default bucket. Keep its rules closed (`allow read, write: if false;`); the site reads and writes with the service account.
3. Google Cloud Console → IAM: the service account needs **Cloud Datastore User** and **Storage Object Admin** on the project.
4. Search Console → techfiyr.com → Settings → Users and permissions: add the service account email (Restricted). Submit `https://techfiyr.com/sitemap.xml` there and in Bing Webmaster Tools.
5. Google Analytics → Admin → Property access management: add the service account email as Viewer.
6. Firestore: no new rules (clients have no access). Optional TTL is not needed for `news`: the job deletes stories older than 30 days.

**Rules:** content written in the admin panel follows section 7.0 like any page (answer-first summary, question headings, real author, no invented facts). Never fill the CMS with sample or placeholder posts or products on production. A product is something TechFiyr really offers.

### 7.5 Privacy, cookies and consent (mandatory)

- `assets/js/consent.js` (loaded on every page after `script.js`) shows the cookie banner and the **Cookie settings** dialog, and stores the choice in `localStorage` (`techfiyr-consent`, 12 months). Global Privacy Control counts as "reject".
- **Nothing that sets non-essential cookies or sends data to a third party may load before consent.** For an embed use `data-consent="embedded" data-src="..." hidden` plus a `data-consent-placeholder="embedded"` element with a "Load" button (see the map on the contact page).
- Adding analytics, a chat widget, video embeds, pixels or any new third-party service: add a category in `consent.js` (and bump its `VERSION`), gate the script on it, and update the Cookie Policy (table, `app/(site)/cookie-policy/page.tsx`) and the Privacy Policy (what data, purpose, legal basis, provider, `app/(site)/privacy-policy/page.tsx`) **in the same change**.
- Any new form must say what the data is used for and link to `/privacy-policy` (see `.booking-privacy` on the contact page).
- Every page's footer keeps the legal links: Privacy Policy, Cookie Policy, Content Policy and the `data-consent-open` "Cookie settings" button.
- When a policy changes, update its "Last updated" date, its date in `app/sitemap.ts`, and `dateModified` in its JSON-LD.

### SEO files and where they live (keep them in sync)

| File | Purpose | Update when |
|---|---|---|
| `metadata` + `<JsonLd>` in each `page.tsx` | Canonical, robots, Open Graph/Twitter, JSON-LD | Any page copy or fact changes |
| `lib/site.ts` | Company facts, shared organisation and breadcrumb JSON-LD | A company fact changes |
| `lib/projects.ts` | Projects: grid, details pages, their metadata and JSON-LD, sitemap entries | A project is added, removed or edited |
| `app/sitemap.ts` | `/sitemap.xml`: every indexable URL, with images and dates | A page is added, removed or its content changes |
| `public/robots.txt` | Allows all search engines and AI crawlers; points to the sitemap | Crawler policy changes |
| `public/llms.txt` | Markdown summary of the company for AI assistants (GEO) | Services, facts, team, projects or pages change |
| `.well-known/security.txt` | RFC 9116 security contact | Before the `Expires` date (yearly) |
| `assets/images/og/techfiyr-og.jpg` | 1200×630 social sharing image | Rename the file if it changes (1-year cache) |
| `netlify.toml` | Legacy `.html` → clean URL redirects; content types and short cache for the discovery files; `noindex` header for `/coming-soon` and `/offline` | A page is renamed or a new discovery file is added |

The homepage has exactly one `<h1>` (the first hero slide). Hero slides 2–3 use `div.slider-one_heading` and the marquee uses `div.marketing-one_word`; CSS at the end of `style.css` keeps them visually identical. Do not turn them back into headings.

### Remaining SEO debt

- The `@font-face` for Font Awesome v4 compatibility in `style.css` points to `../webfonts/fa-v4compatibility*.html`, which were scraped HTML pages (now removed) rather than font files. That rule has never worked.

---

## 8. Checklist before you finish any change

- [ ] Uses only the colours, fonts, radii and components in sections 4–5. Nothing in section 2's "never" list.
- [ ] New CSS is appended to the end of `style.css` under a section banner; no inline styles or `<style>` blocks.
- [ ] `ASSET_VERSION` in `lib/site.ts` bumped for every changed CSS/JS file in `public/assets`; changed images renamed; `sw.js` `VERSION` bumped if its rules changed.
- [ ] Header, nav and footer come from the shared layout; new page added to `NAV` (if top-level) and `app/sitemap.ts`.
- [ ] One `<h1>`, ordered headings, skip link, `<main>`, labelled controls, `alt` text, visible focus, 4.5:1 contrast, works at 320px wide and 200% zoom, keyboard-only navigation tested, reduced-motion respected.
- [ ] Unique title and description, canonical, OG tags, valid JSON-LD matching visible content.
- [ ] Section 7.0 workflow done: one primary query per page, answer-first paragraphs, question-style headings, FAQ where it fits, at least 2 internal links in and 2 out.
- [ ] `app/sitemap.ts` (URL and date) and `public/llms.txt` updated in the same change.
- [ ] `npm run build` passes and the page is listed as prerendered (○ or ●); main content readable with JavaScript off; Lighthouse SEO 100 on mobile.
- [ ] Client-side navigation tested: open the page from another page via a link (not only by reload) and check its sliders, counters and widgets start, and that leaving it leaves nothing behind.
- [ ] Copy is real and specific: no placeholders, invented numbers or fake reviews.
- [ ] Open the page in a browser at desktop, tablet and mobile widths and compare it side by side with `/contact` and `/`. If it looks like it came from a different website, it is wrong.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
