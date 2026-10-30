# E&S Quality Plumbing website

## Run and edit

No package installation is required. Use Node.js 20 or newer.

```
npm run build
npm run check
npm run dev
```

Open http://127.0.0.1:4173/. `build.mjs` generates indexable HTML from `content.mjs`; shared styles, browser interactions, fonts, and optimized media live in `dist/`. Assets are retained when rebuilding. Edit shared HTML in `build.mjs`, content in `content.mjs`, and CSS/JS directly in `dist/`.

## Implemented

- 36 HTML routes, including the homepage, 14 core service pages, About, contact, FAQ, a coverage directory and two established local pages, four project-reference pages, four resource articles, legal/credits pages and a 404 page.
- Original palette, transparent full logo and simplified shield, transparent family illustration used only in the mobile header.
- Locally hosted live-action film: 7.8 seconds desktop / 4.5 seconds mobile. Muted by default, sound toggle, skip, replay, session-only autoplay, reduced-motion and data-saver fallbacks, loading timeout, offscreen pause/finish, final-frame hero continuity.
- Accessible mobile navigation, service dropdown, FAQ disclosures, gallery category filters, image lightbox, service-area selection, OpenStreetMap geography, and mobile call/estimate bar.
- Validated six-step estimate builder with working SMS composition and copy fallback. No false server-submission confirmation.
- Unique page titles/descriptions/canonicals, Open Graph tags, Plumber/Service/breadcrumb JSON-LD, sitemap, robots.txt, semantic headings, local fonts and optimized WebP images.

## Estimate delivery configuration

The business phone number is confirmed in the supplied brief: (619) 507-4947. No email recipient, form provider, or delivery credentials were supplied. The live default therefore prepares a text message for this number; visitors send it in their messaging app. No inquiry is secretly stored or claimed delivered.

`dist/site-config.js` contains an optional `estimateEndpoint`. Set it only after a real HTTPS handler is configured and verified. The client posts JSON with `service`, `property`, `city`, `details`, `name`, `phone`, `email`, `method`, and an empty honeypot `website`. The handler must validate and limit all values server-side, check origin, rate-limit requests, reject the honeypot, and return `{ "success": true }` only after accepting the request into a reliable delivery workflow. Any error, timeout, non-JSON response or non-success response keeps the visitor's details and shows call/text alternatives. Never put delivery secrets in the browser configuration.

The Privacy Policy describes the current SMS-only setup. Update it to describe actual handling and retention before enabling a server endpoint. No paid service dependency is built in.

## Content and media limits

- Exact truck pull-in, technician-door/boots footage was not available. The film uses real faucet and nighttime wet-road footage as the brief's simplified fallback. It does not claim to show an actual E&S callout. No paid AI video service or fabricated vehicle/human animation is used.
- Stock photography is identified and not presented as company project photography. Replace it with supplied company photographs when available. `media` in `build.mjs` maps asset keys to files and alt text; project and service records select their keys.
- Project facts come from the user's business brief. Dates, budgets, testimonials, license claims, operating hours, guarantees and street addresses were not invented.
- Services marked conditional in the original brief (such as hydro jetting, camera inspections, tankless equipment, repiping and slab leaks) are not promoted as verified offerings. Only two established local landing pages are published. Other map cities lead to coverage confirmation; distant/rural locations and further unique city pages await business confirmation.
- Image, footage and font sources/licenses are listed on `/credits/`. Raster transparency was checked in the source files. Full and simplified logo adaptations were made with the built-in image tool; compression and resizing preserve alpha.

## Checks

`npm run check` verifies all generated routes for one H1, unique metadata, local links/assets, valid structured data, and absence of decorative arrow glyphs. Browser QA covers desktop, tablet, and mobile layouts, live playback/transition, sound/replay/skip, menu, form validation and SMS handoff, map selection, gallery filters, and lightbox. Lighthouse scores have not been measured.

The Sites project identity is retained in `.openai/hosting.json`; do not create a second site for this source tree.
