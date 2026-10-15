# Public site redesign plan

Handoff for a Claude Code session. Scope: the **public** site of Ela's Car Rental (`src/app/(public)`). Admin is out of scope.

## Ground rules

- Read `AGENTS.md` first. This is Next 16; check `node_modules/next/dist/docs/` before using any Next API.
- **Do not add features, sections, content, fields or data the user did not ask for.** Rearrange and restyle what exists. If something new seems useful, mention it in one sentence and leave it out.
- This folder is only for the car rental site.
- Colors, sizes and fonts live only in `src/styles/tokens.css`. Visual styling lives in `src/components/ui/`. Pages and features hold layout classes only. All copy lives in `src/content/index.ts`. `npm run check:tokens` enforces this.
- Do not change the logic in `src/features/**/hooks`, `src/api`, `src/mocks` or `src/lib` (formatting helpers excepted, see 1.3).
- The working tree has uncommitted UI work (navbar, modal, toast, motion tokens and keyframes). Keep it. Branch from the current state; do not reset.
- No AI-template styling: no gradients, glassmorphism, decorative icons, pills or badges without meaning, or repeated card grids. Every element needs a purpose.

## Direction

The site should read as a dependable local rental counter: direct, price-forward and dense. It should not look like a SaaS landing page. Hierarchy comes from typography, spacing and composition, not effects. The dark navy theme stays the default, and light mode must keep working.

## Phase 1: Foundations

1. **Fix the fonts.** The home `h1` computes to Tailwind's default system stack, so Plus Jakarta Sans and Inter never render. A likely cause: `--font-heading` and `--font-body` sit in `@theme static` and resolve at `:root`, while the `--font-designer-*` variables are set on `<body>` (`src/assets/fonts.ts`, `src/app/layout.tsx`). Fix the root cause, then verify with `getComputedStyle(h1).fontFamily`.
2. **Use one action color.** Orange (`--accent`) is the only color for forward actions and prices. Make `Button`'s default/primary variant use the accent, or point every forward CTA (Search vehicles, Continue, Send, Book now) at it. Blue is limited to links, focus rings, selection and active-state indicators. Step numbers and decorative uses of `bg-primary` go neutral.
3. **Format prices.** `formatCurrency` in `src/lib/currency.ts` prints `₱4,200.00 (~$72)`. Split it so the PHP amount shows without `.00` as the primary figure, with USD as an optional smaller secondary line (for example a `formatUsd` helper or a `Price` UI component). USD stays available and its prominence drops. Totals in the booking flow and admin keep their exact amounts.
4. **Set the type scale.** Give the hero a heavier, tighter display size, and make page h2s calmer than they are now. Apply `text-wrap: balance` to headings and keep body text under about 65ch.
5. **Reduce surfaces.** Separate sections with spacing or a hairline `border-border` rule instead of alternating `bg-surface` bands plus cards. Keep `Card` only for selectable objects (vehicles, payment options, the booking summary).

## Phase 2: Home (`src/app/(public)/page.tsx`)

The new order uses existing content only:

1. **Hero with search.** Merge the hero and `QuickSearch` into one section: the headline and subtitle, with the search form directly beneath or beside them and `Media asset="hero"` as the secondary visual. The search must sit in the first viewport at 1280×800 and start near the top on mobile. Drop the separate "Find your car" card chrome.
2. **Featured vehicles.** Use the new vehicle card (Phase 3) in an asymmetric layout on desktop, such as one large tile plus a list, instead of 4 identical cards. "View all vehicles" becomes a text link.
3. **How it works.** Use a compact 4-step strip of number and text with no circles or connector line, or one line of reassurance under the search. The copy stays the same.
4. **Reviews.** Show one featured quote large, with the rest in a layout that never leaves an orphan card (4 items in 3 columns is the current bug). "Write a review" becomes a text link.
5. **Remove `CtaBanner` from home.** It repeats the header CTA and the search. The phone number gets prominence in the footer instead.

## Phase 3: Vehicles

- **`vehicle-card.tsx`:** make the whole card one link to the detail page, with one secondary "Book" action, or no button at all on the catalog. The order is name → examples and seats → price per day (largest) → trip total when dates are set. The image is shorter (wide aspect), and the unavailable state stays.
- **`/vehicles`:** keep the filter sidebar and URL params. Tighten the grid gaps, and give the result count and sort one aligned row.
- **`vehicle-detail.tsx` and `vehicle-gallery.tsx`:** fit the name, price, availability and Book in the first viewport next to a shorter gallery. Specs move inline under the title, and the panel stays sticky on desktop.

## Phase 4: Other pages

- **Special offers and About:** remove the decorative row icons. Use an editorial two-column text layout (heading on the left, body on the right). Each offer keeps the existing "Contact us" CTA once at the end. On About, the team stays as a simple list or grid without heavy cards.
- **Contact:** contact details and the form sit side by side as they do now, with fewer nested cards. The phone number and opening hours become the most prominent details.
- **Booking (`/book/*`, `booking-shell.tsx`):** hide the header's "Book now" on `/book/*`. Fix the tab title so it includes the brand (`titleTemplate`). The summary stays visible on every step, collapsible on mobile.
- **Header:** on mobile, show a persistent Book now (beside the menu button, or as a sticky bottom bar on public pages outside `/book/*`).
- **Footer (`site-footer.tsx`, `ui/footer.tsx`):** reduce it to two compact link groups with the phone number first, and move Staff login to the small legal row.
- **Splash (`site-splash.tsx`):** it currently holds every refresh for at least 2.2 s. **Ask the user** before changing it. The recommendation is to show it once per session.

## Phase 5: Motion (restrained)

- Buttons: a press state of `active:scale-[0.98]` and a 150 ms color transition.
- Vehicle results: a short opacity and translate stagger when filters change.
- Booking summary: a smooth height change when the total updates.
- Respect `prefers-reduced-motion` (a global rule already exists). Use the `--ease-*` and `--duration-*` tokens. Do not add scroll-triggered reveals to marketing sections.

## Verification (each phase)

- `npm run verify` (typecheck, lint, check:tokens, build) and `npm run test:e2e`. Update e2e selectors only where markup intentionally changed.
- Use the preview (`.claude/launch.json` → `dev`) at 1280×800 and 375×812, in both dark and light themes. Check: no horizontal scroll, the search above the fold, one orange CTA per view, and fonts actually rendering.
- Keep WCAG AA contrast. The token comments in `tokens.css` list the measured pairs; re-measure any changed pair.

## Out of scope

New sections, a map, extra vehicle specs, an FAQ, real photography, admin restyling.
