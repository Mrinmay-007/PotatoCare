# PotatoCare Web (React + Vite)

```bash
npm install
cp .env.example .env   # optional, defaults point at the existing servers
npm run dev
npm run build
```

Routes: `/login` `/signup` `/home` `/weather` `/diagnose` `/treatment` `/logbook` `/profile`.
See `BUGS_AND_OPTIMIZATIONS.md` for what changed and why.

Structure: `src/utils/rn.js` converts the original React Native style objects to CSS, so `src/styles/*` are almost unchanged;
`src/components/ui.jsx` holds the small View/Text/Touchable primitives.
