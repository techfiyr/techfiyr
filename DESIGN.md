---
name: TechFiyr
description: Mobile app and web software agency in Dhaka; a fresh green, very round, high-contrast marketing site built on the customised iThub template.
colors:
  forest-green: "#237a57"
  fresh-lime: "#c6e45a"
  mist-border: "#dddddd"
  cloud-panel: "#f2f2f2"
  paper-white: "#ffffff"
  ink-black: "#191919"
  body-grey: "#666666"
  long-form-grey: "#555f59"
  muted-sage: "#6b7a72"
  field-grey: "#f5f5f5"
  night-navy: "#00022a"
  footer-black: "#000000"
  footer-charcoal: "#222222"
  review-panel: "#f6f7f8"
  sky-tint: "#dff8ff"
  marketplace-green: "#1dbf73"
  marketplace-green-text: "#0c7c44"
  rating-gold: "#ffbe0b"
typography:
  display:
    fontFamily: "Outfit, serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: "86px"
  headline:
    fontFamily: "Outfit, serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "58px"
  title:
    fontFamily: "Outfit, serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: "34px"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  body-long:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  button:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  outline-word:
    fontFamily: "Raleway, serif"
    fontSize: "100px"
    fontWeight: 800
rounded:
  icon: "50%"
  chip: "50px"
  pill: "50px"
  frame: "50px"
  card-lg: "28px"
  card: "26px"
  textarea: "25px"
  panel: "20px"
  capsule: "150px"
spacing:
  frame-inset: "20px"
  container-gutter: "15px"
  card-gap: "30px"
  section-mobile: "80px"
  section: "120px"
components:
  button-primary:
    backgroundColor: "{colors.forest-green}"
    textColor: "{colors.paper-white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "16px 34px"
  button-primary-large:
    backgroundColor: "{colors.forest-green}"
    textColor: "{colors.paper-white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "20px 50px"
  filter-chip:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.chip}"
    padding: "12px 24px"
  filter-chip-active:
    backgroundColor: "{colors.forest-green}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.chip}"
    padding: "12px 24px"
  input-field:
    backgroundColor: "{colors.field-grey}"
    textColor: "{colors.body-grey}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "10px 30px"
    height: "60px"
  service-card:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.capsule}"
    padding: "75px 30px"
  project-card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.card}"
  cta-bar:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.capsule}"
    padding: "40px 68px"
  page-title-frame:
    backgroundColor: "{colors.night-navy}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.frame}"
---

# Design System: TechFiyr

## Overview

**Creative North Star: "The Greenhouse Studio"**

TechFiyr's site reads like a glasshouse where products are grown: a deep forest green flows into a fresh lime, and that 90° gradient is the brand's signature, spent on the elements that ask for action (buttons, the preloader, section-title dots, carousel arrows). The frames around it are soft and very round, like curved glass panes. Hero and page-title photos sit in a 50px rounded frame inset 20px from the viewport, CTAs and service cards are 150px capsules, and icons sit in circles. The mood is fresh, confident and approachable: bold Outfit headings carry the confidence, and the round geometry and lively hover motion keep it friendly.

Depth comes from contrast before it comes from shadow. White content sections alternate with near-black feature blocks and a black-to-charcoal footer, and page-title photos sit under a 70% navy wash with one giant outlined Raleway word behind the heading. Density is generous: about 120px of vertical rhythm between sections on desktop, a 1320px container, and plenty of air around each heading.

Motion belongs to the personality. Button labels swap on hover while a reversed gradient sweeps up behind them, nav labels roll, service-card icons spin, cards lift, a marquee band scrolls, odometer counters tick and the back-to-top ring fills. All of it switches off under `prefers-reduced-motion`.

The concept is fixed. New work extends this world; it does not redesign it.

**Key Characteristics:**
- Forest-green → lime 90° gradient as the single brand signature
- Very round geometry: 50px pills and frames, 150px capsules, circular icons
- High-contrast white / near-black section blocks
- Navy-washed photo heroes with a giant outlined word
- Uppercase green eyebrow flanked by three pulsing gradient dots
- Lively, tactile hover motion, always with a reduced-motion fallback

## Colors

A two-colour growth gradient on a black-and-white stage. The neutrals do most of the work, so the green and the gradient stand out wherever they appear.

### Primary
- **Forest Green** (`forest-green`): the brand's working colour. Links, eyebrows, icons, focus rings, active states, the scrollbar thumb, and the start of every gradient. It is the only brand colour that is safe for text on white (5.26:1), and on Cloud Panel (4.70:1).

### Secondary
- **Fresh Lime** (`fresh-lime`): the gradient's destination and a highlight accent: the CTA bar border, gradient ends, highlights on dark blocks. On Ink Black it reads at 12.26:1; on white it is only 1.43:1.

### Tertiary
- **Night Navy** (`night-navy`): only as the 70% overlay on page-title photographs, so white headings stay legible over any image.
- **Marketplace Green** (`marketplace-green`, with `marketplace-green-text` for small text): reserved for Fiverr/Upwork trust badges and review tags. **Rating Gold** (`rating-gold`) marks review stars.

### Neutral
- **Paper White** (`paper-white`): page background, and text on dark blocks.
- **Ink Black** (`ink-black`): headings (17.58:1 on white), dark feature sections, service cards.
- **Footer Black → Footer Charcoal** (`footer-black` → `footer-charcoal`): the footer's 180° gradient inside its 50px rounded frame.
- **Body Grey** (`body-grey`): default paragraph copy (5.74:1).
- **Long-form Grey** (`long-form-grey`): body copy on project detail pages.
- **Muted Sage** (`muted-sage`): secondary and meta text. At 4.51:1 it is the lightest grey allowed for normal-size text.
- **Cloud Panel** (`cloud-panel`): light section backgrounds. **Field Grey** (`field-grey`): form field fills. **Review Panel** (`review-panel`): testimonial backdrop.
- **Mist Border** (`mist-border`): borders, scrollbar hover, the stroke on outlined big titles. Decorative only.
- **Sky Tint** (`sky-tint`): the end of the CTA bar's white → sky 90° gradient.

### Named Rules
**The Gradient Signature Rule.** The forest → lime 90° gradient (`linear-gradient(90deg, #237a57 0%, #c6e45a 100%)`) is the brand mark. Its hover state is the same gradient reversed (lime → forest). It goes on action and identity elements, never on body text or headings.

**The Lime Is Never Ink Rule.** Fresh Lime never appears as text on a light background, and small white text never sits over the lime end of the gradient.

**The Marketplace Quarantine Rule.** Marketplace Green appears only on Fiverr/Upwork badges and review tags. It is never a general UI colour.

**The Token-Only Rule.** Colours come from the `:root` variables (`var(--main-color)`, `rgba(var(--main-color-rgb), 0.15)`, `var(--black-color)`) or this list. Never add new hues, slate/zinc greys or purple/blue gradients. Note that `--color-two-rgb` is wrong in the CSS (a template leftover), so write `198, 228, 90` for alpha lime.

## Typography

**Display Font:** Outfit (with serif fallback)
**Body Font:** Manrope (with sans-serif fallback)
**Decorative Font:** Raleway 800, for outlined giant words only

**Character:** Outfit's geometric, slightly rounded bold forms echo the pill geometry and give headings a confident, modern voice. Manrope keeps body and UI text clean and friendly. Raleway appears only as huge hollow letterforms in the background. All three load from the single combined Google Fonts URL with `font-display: swap`.

### Hierarchy
- **Display** (Outfit 700, 72px / 86px): the page's single `h1`, in heroes and page titles.
- **Headline** (Outfit 700, 48px / 58px, capitalised): section headings (`h2` inside the section-title pattern). Plain `h2` is 60px / 70px.
- **Title** (Outfit 700; h3 32/42, h4 26/34, h5 20/30, h6 18/28): card and block titles.
- **Body** (Manrope 400, 16px / 1.7em, Body Grey): default copy. On long-form project pages it is 17px / 1.8 in Long-form Grey.
- **Label** (Manrope 700, 18px, uppercase, Forest Green): the section eyebrow. Breadcrumbs use 18px, weight 500, uppercase.
- **Button** (Manrope 700, 15px, capitalised).
- **Outline Word** (Raleway 800, 100px, uppercase, transparent fill, 1px stroke at 40% white or Mist Border): decorative only, `aria-hidden`, never a heading element.

`responsive.css` scales the desktop sizes down at 1199, 991, 767, 599 and 479px.

### Named Rules
**The Three Families Rule.** Outfit for headings, Manrope for everything readable, Raleway only for hollow decoration. Never add a fourth family (no Inter, Roboto, system-ui or monospace UI text).

**The One H1 Rule.** Each page has exactly one `h1`. Hero slides 2–3 and marquee words are styled `div`s that look like headings but are not.

## Layout

Content sits in a centred `.auto-container` (1320px maximum width, 15px side gutters; 1200px for the narrower variant) on the Bootstrap 5 grid (`row clearfix`, `col-lg-* col-md-* col-sm-12`). Sections stack vertically with about 120px of padding above and below on desktop and 70–80px on mobile. They alternate between white or Cloud Panel and near-black blocks, so the page reads in clear horizontal bands.

The page-title hero and the footer float inside rounded frames inset from the viewport (20px for the page title, 15px for the footer), so the page never runs edge to edge at the top and bottom. Grids of cards use generous 30px gaps; the project grid auto-fills columns at least 340px wide.

New code uses two breakpoints: tablet `max-width: 991.98px` and mobile `max-width: 767.98px`. The template also uses 1199, 599 and 479px. Layouts must work at 320px wide with no horizontal scroll, and at 200% zoom.

## Elevation & Depth

Contrast first, soft shadows second. The main source of depth is the switch between white and near-black blocks, plus the navy photo wash in heroes. Shadows are wide, low-opacity ambient lifts tinted with Ink Black. They sit lightly on cards at rest and deepen on hover as the card rises (`translateY(-6px)` to `-8px`, about 0.3–0.4s).

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 18px 50px rgba(25, 25, 25, 0.06)`): project cards and galleries at rest (galleries use 0.08).
- **Card lift** (`box-shadow: 0 28px 70px rgba(25, 25, 25, 0.12)`): project cards on hover.
- **Large panel** (`box-shadow: 0 30px 70px rgba(25, 25, 25, 0.08)`): big content cards and the booking widget.
- **Image float** (`box-shadow: 0 30px 80px rgba(25, 25, 25, 0.15)`): feature photographs.
- **Dialog** (`box-shadow: 0 30px 70px rgba(25, 25, 25, 0.18)`): the cookie banner and dialog.
- **Green glow** (`box-shadow: 0 4px 12px rgba(35, 122, 87, 0.25)`): hover glow under green action buttons.
- **Sticky header** (`box-shadow: 0 10px 15px rgba(0, 0, 0, 0.04)`): the header once it is fixed on scroll.

### Named Rules
**The Contrast Before Shadow Rule.** If a block needs to stand apart, first try a section-colour change (white ↔ near-black). Only then reach for an ambient shadow, and never a hard, dark or coloured drop shadow other than the green glow.

## Shapes

The form language is very round and soft, with no sharp corners on interactive elements. There are three tiers:

- **Capsules** (150px): CTA bars and service cards, stretched pill silhouettes that look almost like lozenges.
- **Pills and frames** (50px): buttons, inputs, filter chips, the page-title photo frame and the footer frame.
- **Cards** (20–28px): project cards (26px), large panels, the booking widget and the cookie dialog (28px), galleries and side panels (20–24px). Textareas use 25px so they sit comfortably next to pill inputs.

Icons, avatars and section-title dots are full circles (50%). Borders are rare and quiet: a 1px Forest Green line at 12% opacity on cards, 1.5px at 25% on chips, and the 2px Fresh Lime border that outlines the CTA bar.

## Components

### Buttons
Round, tactile and lively: the gradient pill is the site's main call to action.
- **Shape:** full pill (50px).
- **Primary (`btn-style-one`):** the forest → lime gradient with white Manrope 700 15px text, padded 16px 34px. In CTA bars and forms it grows to 20px 50px (or 20px 48px).
- **Hover:** a reversed lime → forest gradient circle sweeps up from below over 800ms, while the label slides up and an identical second copy slides in from underneath (two-line text swap, 0.3s). Markup always repeats the label in `text-one` and `text-two`.
- **Focus:** 2px Forest Green outline, 3px offset (white on dark backgrounds).
- **Consent / utility buttons:** the same pill in a flatter forest-to-mid-green gradient, or Ink Black, with the green glow on hover.

### Chips
- **Filter chips** (projects page): white pill, 1.5px Forest Green border at 25%, Ink Black 16px/700 text. On hover the border and text turn green. When active, the chip fills with a forest → mid-green → lime gradient at 110° and the text turns white.
- **Project chips:** small 13px/700 Forest Green labels on 92% white pills, pinned over card images.

### Cards / Containers
- **Service card (`offer-block_one`):** an Ink Black 150px capsule, padded 75px 30px, with a 100px circular icon holder, a white Manrope title, and a whole-card link. On hover the brand gradient expands horizontally across the card (500ms) and the icon spins 360°.
- **Project card:** white, 26px corners, faint green hairline, 16:10 image that zooms to 1.05 on hover while the card rises 6px and its shadow deepens.
- **CTA bar (`cta-one style-two`):** a 150px capsule with a white → sky 90° gradient and a 2px Fresh Lime border, padded 40px 68px. A small bold eyebrow and a heading sit on the left, the gradient pill button on the right.

### Inputs / Fields
- **Style:** pill fields 60px tall, Field Grey fill, no border, 16px Manrope in Body Grey, 30px side padding. Textareas are 130px tall with 25px corners.
- **Focus:** 2px Forest Green focus-visible outline. Every field has a real `<label>`; a placeholder alone is never the label.
- **Error:** errors are announced through `aria-live="polite"` and linked to the field with `aria-describedby`.

### Navigation
- **Desktop:** an inline Outfit 16px/400 capitalised menu in Ink Black, with 20px between items and 30.5px vertical padding. On hover each label rolls letter by letter, swapping to a Forest Green copy through a text-shadow trick. The current item uses `class="current"` and `aria-current="page"`.
- **Sticky:** after scroll the lower header pins to the top on white, with a fade-down and the sticky-header shadow.
- **Mobile:** a MeanMenu slide-out panel opened by the toggler button.

### Section Title (signature)
The section-title pattern opens every section. An uppercase Forest Green 18px/700 eyebrow sits between two sets of three 10px circular dots. Each dot is filled with the vertical forest → lime gradient and pulses in sequence (3s loop, staggered by 0.5s). Below sits the 48px Outfit headline and optional body text. Add `.centered` to centre it and `.light` on dark blocks.

### Page Title Hero (signature)
The inner-page hero is a photograph in a 50px rounded frame inset 20px, washed with Night Navy at 70%. A white capitalised `h1` sits centred, with an uppercase breadcrumb below it. One giant hollow Raleway word, with a 40% white stroke, sits in the lower left.

## Do's and Don'ts

### Do:
- **Do** use the forest → lime 90° gradient for primary actions and brand moments, reversed on hover.
- **Do** keep geometry very round: 50px pills for buttons and fields, 150px capsules for CTA bars and service cards, 50% circles for icons.
- **Do** alternate white and near-black blocks to create rhythm and depth before reaching for shadows.
- **Do** open sections with the eyebrow-plus-dots section title and an Outfit headline.
- **Do** reuse existing components and extend them with modifier classes (`.cta-one.style-three`) instead of forking them.
- **Do** use Font Awesome 6 icons with `aria-hidden="true"`, inside circular holders where the template does.
- **Do** keep text contrast at 4.5:1 or more (Muted Sage is the floor for normal-size grey text) and wrap every animation in a `prefers-reduced-motion: reduce` override.

### Don't:
- **Don't** set Fresh Lime as text on light backgrounds, or put small white text over the lime end of the gradient.
- **Don't** use Marketplace Green outside Fiverr/Upwork trust badges and review tags.
- **Don't** add new colours, slate/zinc greys, indigo/violet/blue gradients, or new `:root` palettes.
- **Don't** add fonts beyond Outfit, Manrope and Raleway.
- **Don't** use emoji as icons, glassmorphism hero cards, bento grids, emoji pill badges, or gradient text on headings.
- **Don't** use sharp-cornered buttons or fields, or hard, dark drop shadows.
- **Don't** make outlined big words or marquee text into heading elements.
- **Don't** use `<style>` blocks or inline `style` attributes, except `background-image` on template decoration elements.
