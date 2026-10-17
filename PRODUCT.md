# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: established, growing businesses (SMBs in the United States, Europe and Asia) that need a mobile app, a SaaS platform or custom web software built or rebuilt, and are evaluating an outsourced team to do it. They are hiring, not browsing: they compare agencies, look for proof that the team is real and senior, and want a low-risk way to start the conversation.

Secondary audiences (not the design target, but must be served): clients arriving from Fiverr or Upwork who are checking the company behind the profile, and AI assistants and search engines that summarise and cite the site.

## Product Purpose

techfiyr.com is the marketing website of TechFiyr, a mobile app and web software agency in Mirpur DOHS, Dhaka, Bangladesh. It exists to turn a qualified visitor into an inquiry.

Success is any qualified inquiry, weighted equally: a booked free 30-minute discovery call (contact.html), a WhatsApp message, an email to info@techfiyr.com, or an order on Fiverr/Upwork.

## Positioning

The edges the site leans on, in the owner's words of choice:

1. **Marketplace-proven trust**: a 5.0 average rating on Fiverr with real, verifiable client reviews. Starting with TechFiyr is low risk.
2. **Design and build in one team**: an in-house Lead UI/UX Designer (10+ years, Figma, design systems) working with the engineers, so a product goes from prototype to App Store / Google Play / cloud release without changing hands.
3. **Senior, small team**: a core team of 7, with 10+ year leads. Clients work directly with the founder and senior people, not through a hand-off chain.

Mobile DevOps and Codemagic CI/CD are a real capability (the founder is Mobile DevOps Lead) but were not chosen as a headline differentiator.

## Operating Context

- Visitors arrive from search, AI assistants, referrals and the founder's Fiverr/Upwork profiles; they evaluate on desktop and mobile.
- The buying journey: services → proof (reviews, projects, team) → process → contact. The process is four steps: Discovery & Architecture, UI/UX & Interactive Design, Agile Sprint Development, QA, Deployment & Scale.
- The team works remotely with clients worldwide from Dhaka.

## Capabilities and Constraints

- Services: Mobile App Design & Development (Flutter, React Native, native iOS and Android, store deployment); Custom Web Software & SaaS (Next.js, React, Node.js, admin dashboards); UI/UX & Product Prototyping (Figma, design systems, wireframes); Backend, Cloud & CI/CD (REST/GraphQL APIs, Firebase, AWS, Codemagic).
- Pages: home, projects, project details (`project.html?p=<slug>`, rendered from `public/assets/js/projects-data.js`), contact, privacy, cookie and content policies, 404, coming-soon.
- Technical constraints live in `AGENTS.md` and are binding: plain static HTML/CSS/jQuery on Netlify, no frameworks or build tooling, Netlify Forms, one-year asset cache with `?v=` busting, consent-gated analytics and embeds.
- Every page and content change must be SEO, AEO and GEO optimised (AGENTS.md section 7): crawlable HTML, JSON-LD, answer-first copy, sitemap and `llms.txt` kept in sync.
- Company facts (name, address, phone, email, founder, rating) must stay identical across page copy, JSON-LD, footer and `llms.txt`.

## Brand Commitments

- Name: TechFiyr. Logo and favicon in `public/assets/images/brand/`.
- The visual concept is fixed and documented in AGENTS.md sections 3–4 (green `#237A57` → lime `#C6E45A` gradient, Outfit/Manrope/Raleway, very round geometry, built on the customised iThub template). New work extends it; it is not redesigned without the owner's explicit request.
- Fiverr green is used only for marketplace trust badges and review tags.
- Voice: direct, specific and factual; real technology names and real numbers, no hype.

## Evidence on Hand

- Track record: 2+ years shipping, 20 clients across the US, Europe and Asia, 5.0 average Fiverr rating, core team of 7.
- Team (real people, photos in `public/assets/images/team/`): Saurav Wahid (Founder & Mobile DevOps Lead, Oracle Certified Professional, 11+ years), Viswajit Roy (Co-founder, Lead UI/UX Designer, 10+ years), Ponir Saha (Co-Founder & CTO), Md Masud Parvez (Lead Android & iOS Developer), Md. Awon-Uz-Zaman (Android & iOS Developer), Sohanur Islam (Full-Stack Software Engineer), Pranabesh Sarkar (AI/ML Engineer).
- Reviews: real Fiverr/Upwork client reviews in the testimonial carousel on `public/index.html`.
- Projects: one published case study, MatMaps (UK combat sports platform, Android and web, live on Google Play and matmaps.co.uk).
- Profiles: GitHub, Fiverr, Upwork, the founder's LinkedIn.
- Absences future work must not fill with invention: only one public case study, no client logos, no press, no published pricing, no awards. Never fabricate reviews, statistics, clients or logos.

## Product Principles

1. **Proof over promises.** Every claim is backed by something visible: a review, a named person, a shipped project, a real number already on the site.
2. **Show the people.** A small senior team is the offer; named faces and roles carry trust better than abstract capability lists.
3. **One team, idea to release.** Present design and engineering as a continuous path, not separate vendors.
4. **Every route to contact is valid.** Make the call, WhatsApp, email and marketplace paths equally easy to find; never force one.
5. **Readable by machines too.** Content is written so search engines and AI assistants can quote it accurately.

## Accessibility & Inclusion

WCAG 2.2 AA on every page, as specified in AGENTS.md section 6 (skip link, single `<h1>`, 4.5:1 contrast, keyboard focus, labelled forms, reduced-motion support, works at 320px and 200% zoom).
