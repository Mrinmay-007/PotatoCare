# PotatoCare – Bugs found & optimizations

Scope: the Expo / React Native app in `Frontend.zip` was converted to a **React JS (Vite) web app**.
UI (colors, layout, copy, icons) and **all FastAPI routes are unchanged**.
Items marked **[backend]** cannot be fixed on the frontend without changing a route.

## 1. Bugs fixed

| # | Where | Bug | Fix |
|---|-------|-----|-----|
| 1 | `TreatmentScreen` | `DetailRow`, `DetailListItem`, `WeatherEntry`, `RiskValue`, `DiseaseCardTitle` were declared **inside** the component. React saw a new component type on every render, so every item remounted and re-requested its translation on any state change. | Moved to module level. |
| 2 | `TreatmentScreen` | Details only rendered if `selectedDisease.disease === expandedDisease`. If the API returns `early blight` and the card is `Early Blight`, the card expands to an empty box. | Details stored per card name, no string comparison. |
| 3 | `LogbookScreen` | Severity mismatch: Diagnose saves `Healthy/Mild/Moderate/Severe`, Logbook only knew `low/medium/high`. "Moderate" and "Severe" showed green and **"Moderate" was dropped from the bar chart**. | `normalizeSeverity()` maps all values to low / medium / high. |
| 4 | `LogbookScreen` | "Latest" showed `history[0]`, i.e. whatever the server returned first. | Newest record by date + time. |
| 5 | `LogbookScreen` | Sorting used `new Date(prediction_date)` only (ignores time, `Invalid Date` for `DD-MM-YYYY`). | `parseDateTime()` handles ISO and `DD-MM-YYYY`, uses time. |
| 6 | `LogbookScreen` | Tabs stay mounted in RN, so a diagnosis saved in Diagnose did not appear until manual refresh. | Each tab is a route and refetches on open. |
| 7 | `LogbookScreen` | `fetchData` set the full-screen `loading` flag, so pull-to-refresh blanked the page. | Full loader on first load only. |
| 8 | `LogbookScreen` | Filter used `includes()` (substring match). | Exact match. |
| 9 | `HomeScreen` | Greeting copied into state once, stayed English after translation/language change. | Derived with `useMemo`. |
| 10 | `HomeScreen` | `useEffect(fetchWeather, [])` registered twice -> weather requested twice per visit. | One effect. |
| 11 | `WeatherScreen` | Every tab/leaf change replaced the whole screen with a spinner (tab bar and leaf selector unmounted). | In-place loader. |
| 12 | `WeatherScreen` | Race: switching tabs quickly let an older response overwrite newer data. Threat and Analysis shared one state variable, so each showed the other's data. | Request-id guard + per-view cache. |
| 13 | `WeatherScreen` | `/weather/compatible` returns `risk_level`, `/weather/threat` returns `Risk_Level`; code read one name per call. | Reads both. |
| 14 | `WeatherScreen` | Bar chart titled "Feels-like vs Actual" but plotted max temperature. Missing readings plotted as `0`. | Title now "Max Temperature"; missing values are gaps. `shortTime()` no longer crashes on odd timestamps. |
| 15 | `DiagnoseScreen` | Save button label while saving was "Fetching treatment & weather insights..." | Own "Saving diagnosis..." label. |
| 16 | `DiagnoseScreen` | "Checking leaf type..." hard-coded English; unknown model class hid the result card but still showed Save. | Translated; fallback style for unknown classes. |
| 17 | `DiagnoseScreen` | Potato threshold `confidence >= 0.5` is meaningless if `/detect/` returns 0-100 (always true). `confidence.toFixed` crashed on non-numbers. | Normalises 0-1 and 0-100; safe formatter. |
| 18 | `DiagnoseScreen` | In-flight requests kept running after leaving the screen / pressing reset, then wrote state. Preview URL never released. | `AbortController`, `revokeObjectURL`. |
| 19 | `Login/Signup` | App always opened on Login even when a session was stored. | `RequireAuth` / `PublicOnly` route guards. |
| 20 | `translate` / `useTranslate` | Unhandled promise rejection when the translate call failed. | Falls back to original text. |
| 21 | `Signup` | Name/email not trimmed (`" a@b.com"` fails login). | Trimmed. |
| 22 | misc | Dead code: `savePredictionFromDiagnose` (never called), ~300 commented-out lines, unused imports. | Removed. |

## 2. Optimizations

- **Translation traffic (biggest win).** Before: one `GET /translate/` per string per render, no cache, so Weather/Treatment fired dozens of calls (numbers, `28°C`, dates were sent too). Now: memory + `localStorage` cache, in-flight de-duplication, strings without letters skipped, max 6 concurrent requests.
- **Image upload.** Photo is centre-cropped to a square, resized to <=1024 px, JPEG 0.8 (same as the phone's picker) and **built once, reused for `/detect/` and `/predict/`** (was encoded/built twice). Much smaller upload on mobile data.
- **Parallel requests.** Logbook history + dashboard, Diagnose treatment + weather-compat use `Promise.all/allSettled`.
- **Caching.** Weather views cached per tab/leaf; Treatment details cached per disease. Refresh forces reload.
- **One HTTP layer.** `fetch` + axios + 4 hard-coded URLs -> single axios setup with timeouts; URLs in `.env` (`VITE_API_URL`, `VITE_ML_URL`).
- **Single auth source.** `AuthContext` replaces three screens each reading AsyncStorage.
- **Bundle.** Icons imported individually (tree-shaken); no native-only packages.

## 3. Still open (needs backend or product decision)

1. **[backend] PIN in the URL** - `POST /user/login?email=..&pin=..` leaks credentials into logs/history. Should be a JSON body. Frontend kept the route as requested.
2. **[backend] PIN stored/returned as-is** - confirm it is hashed server-side. Login response is stored in `localStorage` (readable by any script); prefer an httpOnly cookie or token.
3. **[backend] No auth on `/log/history/{user_id}`** - anyone who knows an id can read it.
4. **[backend] `/translate/` is GET with text in the query** - long strings can hit URL limits; a batch POST would remove most requests.
5. **[backend] Inconsistent route shapes** - Treatment calls `/treatment/Early Blight`, Diagnose calls `/treatment/early blight`. Works only if the server normalises both.
6. **[backend] Confidence scale** - confirm `/detect/` vs `/predict/` use the same scale (see #17).
7. **Two backends** - model server (Railway) and API (fastapicloud); a cold start can take >30 s, hence the 90 s ML timeout.
8. "AI Plant Doctor -> Start Chat" and the notification bell are not wired to anything (unchanged from the original).

## 4. UI differences (unavoidable on web)

- Pull-to-refresh works by touch only; desktop users reload the page or revisit the tab.
- `Alert.alert` is a browser `alert()`.
- App renders in a centred phone-width column (max 520 px).
- "Take Photo" opens the camera on phones; on desktop it opens the file picker.
- Charts use `recharts` instead of `react-native-chart-kit` (same data/colors, slightly different rendering).

## 5. Verification done

No network was available, so `npm install` / `vite build` were **not** run. Instead: esbuild bundled the whole project (all local imports resolve), every screen server-rendered, and 8 screens were opened in headless Chromium with a mocked API (screenshots checked; `recharts` stubbed, so the **charts themselves are untested**). Please run `npm install && npm run dev` once and check the Weather/Logbook charts.
