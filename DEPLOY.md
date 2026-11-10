# Outfit Finder

Type an outfit, get every piece broken out with places to order it, plus the
extras that finish the look (shoes, bag, jewelry, layers).

## How it works

1. `POST /api/analyze` turns the description into a list of pieces.
   - With `ANTHROPIC_API_KEY`: Claude acts as the stylist (better names, smarter
     search terms, thoughtful "complete the look" additions).
   - Without it (or if the call fails): a built-in keyword breakdown is used.
2. `POST /api/search` attaches, for every piece:
   - search links straight into stores that fit the chosen budget
     (`lib/stores.js`), always starting with Google Shopping;
   - real product listings (photo, price, store) when `SERPAPI_KEY` is set.

The app works with zero keys. Each key makes it better.

| Env var | Needed? | What it adds |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Recommended | AI stylist breakdown. Get one at https://console.anthropic.com |
| `SERPAPI_KEY` | Optional | Real product cards from Google Shopping. https://serpapi.com |

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test
```

## Deploy to Vercel

1. Import this repo at https://vercel.com/new (no build settings needed).
2. Project → Settings → Environment Variables: add the keys above.
3. Redeploy, then send her the link. On iPhone: Share → Add to Home Screen.

## Customizing

- Stores and which budget tier they appear in: `lib/stores.js`
- Stylist instructions: `SYSTEM` in `api/analyze.js`
- Quick-idea chips: `index.html`
- Colors: `:root` in `styles.css`
