# AGENTS.md — TechFiyr website

Instructions for any AI coding agent (Claude Code, Cursor, Copilot, Codex, etc.) and any human contributor working on this repository. Read this whole file before you change anything.

TechFiyr is a mobile app and web software agency based in Mirpur DOHS, Dhaka, Bangladesh. This repo is the company's marketing website.

> **Non-negotiable: every page and every piece of content must be SEO, AEO and GEO optimised.**
> Whenever you add a page, a section, a project, a service, an FAQ, or change any copy, follow the workflow in **section 7.0** in the same change: Google Search, ChatGPT, Claude, Perplexity, Gemini and other AI crawlers must be able to find, read, understand and quote it. A change that skips this is not finished, even if it looks right in the browser.

---

## 1. Project at a glance

| Item | Value |
|---|---|
| Stack | Plain static HTML + CSS + jQuery/vanilla JS. **No build step, no framework, no package manager.** |
| Base template | "iThub" multipurpose business HTML template, customised for TechFiyr |
| Hosting | Netlify (Netlify Forms for the booking form; `_headers` sets cache rules) |
| Production domain | `https://techfiyr.com` (use it for canonical, Open Graph and JSON-LD URLs) |
| Pages | `index.html`, `projects.html`, `project.html?p=<slug>` (project details, rendered by JS), `contact.html`, `404.html`, `coming-soon.html` |
| Main stylesheet | `assets/css/style.css` (template CSS with `global.css`, `header.css`, `footer.css` etc. already **inlined** into it) |
| Other loaded CSS | `bootstrap.css`, `meanmenu.min.css`, `responsive.css` |
| Portfolio data | `assets/js/projects-data.js` (single source of truth for projects) |

Files under `assets/css/` such as `global.css`, `header.css`, `footer.css`, `dark-body.css`, `rtl.css`, and `color-switcher-design.css` are **not loaded by any page**. Editing them changes nothing. Edit `style.css`.

---

## 2. Hard rules: no agent default styling, no agent default code style

AI agents tend to produce a recognisable "default" look and code style. **None of it is allowed here.** All new work must look and read as if the original template author wrote it.

### Never introduce

- Tailwind, utility-class CSS frameworks, CSS-in-JS, Sass/PostCSS, or any build tooling.
- React, Vue, Svelte, Alpine, web components, TypeScript, ES modules, bundlers, or npm dependencies.
- New fonts: no `Inter`, `system-ui`, `-apple-system`, `Roboto`, `Geist`, or monospace UI text.
- New colours: no indigo/violet/purple/blue gradients, no slate/zinc greys, no `#6366f1`, `#8b5cf6`, `#3b82f6`, `#0f172a` and so on. Use only the tokens in section 4.
- Generic "SaaS landing page" patterns: glassmorphism hero cards, bento grids, pill badges with emoji, "✨" or any emoji used as icons, gradient text on every heading, centred 3-column feature grids with rounded-xl cards and soft shadows.
- Emoji as icons. Icons come from **Font Awesome 6** (already bundled), e.g. `<i class="fa-solid fa-check" aria-hidden="true"></i>`.
- New CSS reset, new `:root` palettes, new design-token files, or new global stylesheets.
- `<style>` blocks or `style="..."` attributes in pages. The one existing exception is `style="background-image:url(...)"` on template decoration/background elements; keep that pattern only for background images.
- Placeholder copy such as "Lorem ipsum", "Acme Inc.", "John Doe", fake testimonials, fake statistics, or fake client logos.

### Code style to follow (match the existing files)

**HTML**
- Indent with **tabs**. Lower-case tags and attributes, double quotes.
- Keep the template's comment markers around every section: `<!-- Contact Two -->` … `<!-- End Contact Two -->`.
- Use the template's BEM-ish class naming: `block`, `block_element`, `block_element-part`, plus modifier classes like `style-two`, `light`, `centered` (e.g. `sec-title_heading`, `contact-info_block-inner`, `cta-one style-two`).
- Use Bootstrap grid and utility classes that are already in use (`row clearfix`, `col-lg-6 col-md-6 col-sm-12`, `d-flex`, `justify-content-between`, `align-items-center`, `flex-wrap`, `gap-3`, `ms-3`, `d-none d-md-inline-flex`).
- JS hooks use `data-*` attributes (`data-booking-form`, `data-projects-grid`), not ids or styling classes.

**CSS**
- Add new rules **only at the end of `assets/css/style.css`**, inside a section banner in the existing format:

  ```css
  /* ==========================================================================
     Services detail page (services.html)
     ========================================================================== */
  ```

- 2-space indentation inside `style.css` rules, one property per line, lower-case hex, `0` without units where the file already does so.
- Use the existing variables (`var(--main-color)`, `rgba(var(--main-color-rgb), 0.15)`, `var(--black-color)`, `var(--white-color)`) instead of hard-coded values.
- Reuse existing component classes before writing new ones. If you need a variant, add a modifier class (`.cta-one.style-three`), do not fork the component.
- Breakpoints: `max-width: 991.98px` (tablet) and `max-width: 767.98px` (mobile) for new code; the template also uses 1199/599/479px in `responsive.css`.
- Wrap any new animation or transition in a `@media (prefers-reduced-motion: reduce)` override.

**JavaScript**
- ES5, inside an IIFE with `'use strict';`, `var`, `function` declarations, tabs. See `assets/js/booking.js` and `assets/js/projects.js`.
- Header comment at the top of every new file explaining what page uses it and where its data comes from.
- jQuery is available (`script.js` uses it); new page-specific widgets may be vanilla JS like `booking.js`.
- Escape any data inserted into HTML (see `esc()` in `projects.js`).
- No external API calls, trackers or ad scripts without the owner's approval.

**Cache busting (mandatory)**
- `_headers` caches `/assets/*` for one year. Every time you change a CSS or JS file, bump its `?v=` query string **in every HTML page that loads it** (format `?v=YYYYMMDD` or `?v=YYYYMMDD.N`).
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

Copy an existing inner page (`contact.html` or `projects.html` is the best starting point) and keep its structure. Do not hand-write a new header or footer.

### 5.1 Required page skeleton

1. `<head>` (see section 7.1 for the full SEO head).
2. `.page-wrapper` → `.preloader` → `header.main-header.header-style-one` (header-top, header-lower, mobile-menu), copied exactly. Set `class="current"` on the matching nav item and add `aria-current="page"` to its link.
3. `<main id="main">` wrapping all page content (new pages must add this; see section 6).
4. `section.page-title` hero: `page-title_big-title` (one outlined word), `page-title_bg-image` (photo from `assets/images/background/`), `page-title_shape-one/two`, the page's single `<h1>`, and `ul.bread-crumb`.
5. Content sections built from existing components (5.2).
6. `section.cta-one.style-two` call to action before the footer when it fits.
7. `footer.main-footer`, copied exactly.
8. `.progress-wrap` back-to-top, then the same script list as other pages, in the same order, with the same `?v=` values. Page-specific scripts go last.

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

When you add a page, also: add it to the main nav (all pages) if it is a top-level page, add it to `sitemap.xml`, and add internal links to it from relevant existing sections.

---

## 6. Accessibility (WCAG 2.2 AA is mandatory on every page)

### Required on every new or edited page

- `<html lang="en">`, a unique descriptive `<title>`, and `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (never disable zoom).
- A skip link as the first focusable element: `<a class="skip-link" href="#main">Skip to content</a>`, and `<main id="main">`. Add the `.skip-link` style once at the end of `style.css` (visually hidden until focused, brand green background, white text).
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
- Form fields in `contact.html` use placeholders without labels.
- `.btn-style-one` has white text over the green→lime gradient; around the lime end, contrast drops below 3:1. When restyling is approved, darken the gradient end behind text or add a text shadow. Do not do this without the owner's approval, because it is a design change.
- No skip link and no `<main>` on existing pages.
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
4. Choose a short, lower-case, hyphenated file name that contains the main keyword (`flutter-app-development.html`).

**B. While writing: on-page SEO, AEO and GEO**

1. **Title** (≤ 60 chars, primary query first, `| TechFiyr` last), **meta description** (150–160 chars with a proof point), **`<h1>`** and **URL** all target the same primary query, worded naturally.
2. **Answer first**: the first paragraph under the `<h1>`, and under every `<h2>`, is a direct 40–60 word answer that can be quoted on its own. Then add detail.
3. Phrase `<h2>`/`<h3>` headings as the questions people ask, covering the secondary queries.
4. Use **specific, verifiable facts**: tech names (Flutter, React Native, Next.js, Codemagic), numbers that already appear on the site (20 clients, 5.0 Fiverr rating, 2+ years), real project names, real locations. Never invent stats, clients or reviews.
5. Use the right semantic HTML: lists, `<table>` for comparisons and pricing, `<dl>` for specs, `<figure>`/`<figcaption>`, `<time datetime>`, `<address>`.
6. Add a visible **FAQ** of 3–6 real questions on service, pricing and contact pages, and mark it up with `FAQPage`.
7. **Internal links**: link **to** the new page from at least 2 relevant existing pages or sections, and **from** it to at least 2 related pages (a service, a project, contact). Use descriptive anchor text.
8. **Images**: descriptive file name, meaningful `alt`, compressed, `loading="lazy"` below the fold. Add a 1200×630 OG image in `assets/images/og/` for important pages.
9. Keep company facts (name, address, phone, email, founder, rating) **identical** to `index.html` JSON-LD and `llms.txt`.

**C. Head and structured data (section 7.1 and 7.2)**

1. Full head block: canonical, robots, Open Graph, Twitter, `llms.txt` alternate link, the combined Google Fonts link.
2. JSON-LD `@graph` with the page type (`WebPage`, `Service`, `ContactPage`, `CollectionPage`, `Article`, `FAQPage`), the shared `ProfessionalService` node (`@id` `https://techfiyr.com/#organization`), and `BreadcrumbList` on inner pages. Everything in it must be visible on the page.

**D. Discovery files: update in the same change**

1. `sitemap.xml`: add the URL (with its main images) and set `<lastmod>` to today. When you edit an existing page's content, update its `<lastmod>` too.
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

### 7.1 Required `<head>` for every indexable page

Order and format to follow (tabs, same stylesheet/font links and `?v=` values as other pages):

```html
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Primary Keyword Phrase | TechFiyr</title>
	<meta name="description" content="150–160 characters: what the page offers, for whom, and one proof point.">
	<link rel="canonical" href="https://techfiyr.com/page-name.html">
	<meta name="robots" content="index, follow, max-image-preview:large">

	<!-- Open Graph / social -->
	<meta property="og:type" content="website">
	<meta property="og:site_name" content="TechFiyr">
	<meta property="og:title" content="Same intent as <title>">
	<meta property="og:description" content="Same as meta description">
	<meta property="og:url" content="https://techfiyr.com/page-name.html">
	<meta property="og:image" content="https://techfiyr.com/assets/images/og/page-name.jpg">
	<meta property="og:image:alt" content="Describe the image">
	<meta property="og:locale" content="en_US">
	<meta name="twitter:card" content="summary_large_image">

	<link rel="icon" href="assets/images/favicon.png" type="image/png">

	<!-- Stylesheets (same as every page) -->
	…
	<!-- Fonts (same three Google Fonts links) -->
	…

	<!-- Structured data -->
	<script type="application/ld+json">…</script>
</head>
```

Rules:
- `<title>` ≤ 60 characters, unique, primary keyword first, brand last (`… | TechFiyr`).
- Meta description 150–160 characters, unique, no keyword stuffing. Do not add `meta keywords` to new pages (search engines ignore it).
- Canonical URLs are absolute and use `https://techfiyr.com`.
- OG images are 1200×630 JPG/WebP under `assets/images/og/`.
- Pages that should not be indexed (`coming-soon.html`, thank-you pages, `404.html`) use `<meta name="robots" content="noindex, nofollow">` and are left out of the sitemap.

### 7.2 Structured data (JSON-LD)

Use JSON-LD in the `<head>` only, never microdata. The data must match visible page content exactly; never mark up content the user can't see.

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
	"logo": "https://techfiyr.com/assets/images/logo.svg",
	"email": "info@techfiyr.com",
	"telephone": "+8801722364642",
	"address": {
		"@type": "PostalAddress",
		"streetAddress": "341/342, Mirpur DOHS",
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
- **Projects are dynamic**: `projects.html` renders the catalog and `project.html?p=<slug>` renders the details, both from `assets/js/projects-data.js`. The whole card links to the details page. `projects.js` (`setSeo`) sets the title, description, canonical, OG tags, `<h1>` and JSON-LD per project. Google renders this; most AI crawlers do not, so for each new project also:
  1. Add `https://techfiyr.com/project.html?p=<slug>` to `sitemap.xml`.
  2. Add it to the `ItemList` JSON-LD and the `<noscript>` list in `projects.html`.
  3. Add it to the Projects section of `llms.txt`.
  4. Bump `?v=` on `projects-data.js` in `projects.html` and `project.html`.
- Maintain `sitemap.xml` (every indexable page, absolute URLs, `<lastmod>`) and `robots.txt` at the site root (`Sitemap: https://techfiyr.com/sitemap.xml`; allow AI crawlers such as `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` unless the owner says otherwise).
- Maintain `llms.txt` at the root: a short Markdown summary of who TechFiyr is, services, contact details, and links to key pages.
- Descriptive internal link text ("See our Flutter projects", not "click here").
- Clean, lower-case, hyphenated file names (`mobile-app-development.html`).
- Images: compressed WebP/JPG, explicit `width`/`height`, `loading="lazy"` below the fold, `fetchpriority="high"` on the hero/LCP image only. Descriptive file names.
- Keep Core Web Vitals healthy: no new render-blocking third-party scripts, no layout shift from late-loading content, `font-display: swap` (already in the Google Fonts URLs).
- **Performance rules (keep them):**
  - The `.preloader` hides on DOM ready (`script.js`), with a CSS fallback after 2.5s. Never tie it to `window.load` again; that made visitors stare at the gradient until every image had downloaded.
  - Load Google Fonts with the single combined URL used on every page (`Manrope 300..800`, `Outfit 100..900`, `Raleway 800`). Don't add separate font links or unused weights.
  - Every `<img>` below the fold gets `loading="lazy" decoding="async"`; the header logos and the hero don't.
  - Preload the LCP image when it's a CSS background (see the hero preload in `index.html`).
  - Resize photos to the size they display at (about 2× the card width, e.g. ≤ 640px for team photos) and compress them (JPEG quality ~82, progressive) before committing.
- Every page must remain usable with JavaScript disabled for its core text and links.

### 7.5 Privacy, cookies and consent (mandatory)

- `assets/js/consent.js` (loaded on every page after `script.js`) shows the cookie banner and the **Cookie settings** dialog, and stores the choice in `localStorage` (`techfiyr-consent`, 12 months). Global Privacy Control counts as "reject".
- **Nothing that sets non-essential cookies or sends data to a third party may load before consent.** For an embed use `data-consent="embedded" data-src="..." hidden` plus a `data-consent-placeholder="embedded"` element with a "Load" button (see the map on `contact.html`).
- Adding analytics, a chat widget, video embeds, pixels or any new third-party service: add a category in `consent.js` (and bump its `VERSION`), gate the script on it, and update `cookie-policy.html` (table) and `privacy-policy.html` (what data, purpose, legal basis, provider) **in the same change**.
- Any new form must say what the data is used for and link to `privacy-policy.html` (see `.booking-privacy` on `contact.html`).
- Every page's footer keeps the legal links: Privacy Policy, Cookie Policy, Content Policy and the `data-consent-open` "Cookie settings" button.
- When a policy changes, update its "Last updated" date, its `<lastmod>` in `sitemap.xml`, and `dateModified` in its JSON-LD.

### SEO files and where they live (keep them in sync)

| File | Purpose | Update when |
|---|---|---|
| `<head>` of each page | Canonical, robots, Open Graph/Twitter, JSON-LD | Any page copy or fact changes |
| `assets/js/projects.js` (`setSeo`) | Per-project title, description, canonical, OG, `<h1>` and JSON-LD on `project.html?p=<slug>` | Rarely; data comes from `projects-data.js` |
| `projects.html` | Static `ItemList` JSON-LD and `<noscript>` project list for crawlers that don't run JS | A project is added or removed |
| `sitemap.xml` | Every indexable URL, with images and `<lastmod>` | A page is added, removed or its content changes |
| `robots.txt` | Allows all search engines and AI crawlers; points to the sitemap | Crawler policy changes |
| `llms.txt` | Markdown summary of the company for AI assistants (GEO) | Services, facts, team, projects or pages change |
| `.well-known/security.txt` | RFC 9116 security contact | Before the `Expires` date (yearly) |
| `assets/images/og/techfiyr-og.jpg` | 1200×630 social sharing image | Rename the file if it changes (1-year cache) |
| `_headers` | Content types and short cache for the discovery files; `noindex` header for `coming-soon.html` | A new discovery file is added |

The homepage has exactly one `<h1>` (the first hero slide). Hero slides 2–3 use `div.slider-one_heading` and the marquee uses `div.marketing-one_word`; CSS at the end of `style.css` keeps them visually identical. Do not turn them back into headings.

### Remaining SEO debt

- Project details are rendered by JavaScript, so AI crawlers that don't run JS see only the generic `project.html` shell. `llms.txt` and the `<noscript>` list on `projects.html` cover the essentials.
- The `@font-face` for Font Awesome v4 compatibility in `style.css` points to `../webfonts/fa-v4compatibility*.html`, which were scraped HTML pages (now removed) rather than font files. That rule has never worked.

---

## 8. Checklist before you finish any change

- [ ] Uses only the colours, fonts, radii and components in sections 4–5. Nothing in section 2's "never" list.
- [ ] New CSS is appended to the end of `style.css` under a section banner; no inline styles or `<style>` blocks.
- [ ] `?v=` bumped in **every** page that loads a changed CSS/JS file; changed images renamed.
- [ ] Header, nav and footer identical across pages; new page linked in nav and in `sitemap.xml`.
- [ ] One `<h1>`, ordered headings, skip link, `<main>`, labelled controls, `alt` text, visible focus, 4.5:1 contrast, works at 320px wide and 200% zoom, keyboard-only navigation tested, reduced-motion respected.
- [ ] Unique title and description, canonical, OG tags, valid JSON-LD matching visible content.
- [ ] Section 7.0 workflow done: one primary query per page, answer-first paragraphs, question-style headings, FAQ where it fits, at least 2 internal links in and 2 out.
- [ ] `sitemap.xml` (URL and `<lastmod>`) and `llms.txt` updated in the same change.
- [ ] Main content readable with JavaScript off; Lighthouse SEO 100 on mobile.
- [ ] Copy is real and specific: no placeholders, invented numbers or fake reviews.
- [ ] Open the page in a browser at desktop, tablet and mobile widths and compare it side by side with `contact.html` / `index.html`. If it looks like it came from a different website, it is wrong.
