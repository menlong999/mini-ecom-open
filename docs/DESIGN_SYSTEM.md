# Design System

This project uses TDesign Mini Program as a component library, but the product
visual language is owned by this repository. Do not copy TDesign retail template
colors, imagery, or promotional visual patterns into product pages.

## Visual Direction

The customer-facing mini program should feel restrained, clean, and trustworthy.
It should not look like a funeral product catalog, and it should not look like a
flash-sale retail template.

Core words:

- Calm
- Plain
- Warm but not decorative
- Service-oriented
- Easy to scan

## Customer-Facing Theme

Use the global tokens from `miniprogram/style/theme.wxss`.

- Primary: `--color-primary`
- Pressed primary: `--color-primary-pressed`
- Light primary surface: `--color-primary-light`
- Price: `--color-price`
- Page background: `--color-page`
- Card surface: `--color-surface`
- Border: `--color-border`
- Text: `--color-text`, `--color-text-secondary`, `--color-text-muted`

Customer-facing pages should use white cards, light borders, limited shadows,
and quiet spacing. Price text uses `--color-price`; interaction state uses
`--color-primary`.

## Admin Theme

Admin pages use the same layout discipline but a different accent so operators
can clearly distinguish management screens from customer screens.

Admin roots inherit:

- `--admin-primary`
- `--admin-primary-light`
- `--admin-page`
- `--admin-border`

Admin screens should favor dense, scannable lists and forms. Avoid decorative
headers and marketing-style sections.

## Rules

- Do not use legacy retail red/orange colors such as `#fa4126`, `#fa550f`, or
  `#ff5f15`.
- Do not use TDesign retail template assets from `tdesign.gtimg.com`.
- Use `--color-price` for money, not the primary interaction color.
- Use `--color-primary` for selected states, primary actions, and links.
- Use `--color-danger` only for destructive or abnormal states.
- Avoid page-specific palettes unless they map back to a token.
- Keep customer-facing and admin accents separate.

`npm run style:check` enforces the most important legacy-template restrictions.
