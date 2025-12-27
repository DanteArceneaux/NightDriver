## v4.0 Context Pack (for avoiding chat context loss)

If the chat truncates, the agent should **read this file first**, then:
- `backend/src/data/microZones.ts`
- `backend/src/services/scoring.service.ts`
- `backend/src/routes/api.routes.ts`
- `backend/src/services/events.service.ts`
- `frontend/src/components/Map/SeattleMap.tsx`

### Status (as of last edit)

- **Goal**: v4.0 = ultra-granular “micro-zones” + money-making intelligence (ferries, hotel checkout, hospital shifts, trip chains, competitor density, encore timing, UW schedules) + push to GitHub.
- **Tests**: explicitly **skipped for now** (user request).

### What’s implemented already

- **Micro-zones**: `backend/src/data/microZones.ts` now contains **100+ micro-zones** (Seattle core + key suburbs).
- **Scoring uses micro-zones**:
  - `backend/src/services/scoring.service.ts` now scores `scoringZones = microZones + legacyZones(not replaced)`.
  - Micro-zones use `peakHours` for baseline (instead of `timePatterns`).
  - Micro-zone meta boosts use `averageRideValue`, `competitorDensity`, `riderQuality`.
  - Micro-zone bar-close uses `barCloseSurge` metadata (1:45–2:30am window).
- **Ferries**:
  - `backend/src/services/ferries.service.ts` adds a conservative ferry “wave” heuristic.
  - Wired into `ScoringService` and exposed via `GET /api/money-makers`.
- **Hotel checkout surge**:
  - `backend/src/services/hotelCheckout.service.ts` adds checkout + airport-hotel morning waves.
  - Wired into `ScoringService` and exposed via `GET /api/money-makers`.
- **Hospital shift changes**:
  - `backend/src/services/hospitalShifts.service.ts` adds shift-change waves.
  - Wired into `ScoringService` and exposed via `GET /api/money-makers`.
- **UW class-change bursts**:
  - `backend/src/services/uwClasses.service.ts` adds weekday class-change bursts.
  - Wired into `ScoringService` and exposed via `GET /api/money-makers`.
- **Driver Pulse (crowdsourced ground truth)**:
  - `DriverPulseService.getScoreModifier()` is applied in `GET /api/zones` and WebSocket broadcasts.
  - Adds `factors.pulse` and adjusts `score` in real time (not cached).
- **Trip chain intelligence**:
  - `backend/src/services/tripChain.service.ts` + `GET /api/trip-chain/:fromZoneId` suggests next zones using micro-zone metadata + live scores + distance penalty.
- **API zone lookup supports micro-zones**:
  - `backend/src/routes/api.routes.ts` `/api/zones/:id` uses `getZoneMetaById()` which checks `microZones` first, then legacy `zones`.
- **Events map to micro-zones**:
  - `backend/src/services/events.service.ts` updated venue mapping for major venues (stadiums, Seattle Center, Pike/Pine, etc.).
  - SeatGeek mapping updated similarly in `backend/src/services/seatgeek.service.ts`.
- **Cruise + convention mapping updated to micro-IDs**:
  - `backend/src/services/cruiseShips.service.ts` now targets `pier91_cruise_terminal` / `pier66_cruise_terminal` etc.
  - `backend/src/services/conventions.service.ts` now boosts `convention_center`, `financial_district`, `retail_core`, `downtown_hotel_row_union`.
- **Bar-close zones updated to micro IDs**:
  - `backend/src/data/barCloseTimes.ts` now uses `pike_pine_bars`, `belltown_bars`, `ballard_ave`, `the_ave`, `pioneer_square_south`, etc.

### Known gaps / TODOs for v4.0

#### Backend features still to implement (services + scoring + `/api/money-makers`)

- **Encore timing improvements**: optional integration (Setlist.fm) — likely needs API key; otherwise keep heuristics per venue/type.
- **Restaurant worker rides / parking enforcement / fuel optimization / minimum fare alerts / hidden surge spots / circuit strategy**: still a good follow-up set; implement as deterministic heuristics first, then tune with user trip logs.

#### Frontend wiring still to do

- `TripLogger`, `HeatmapOverlay`, and `PerformanceView` no longer depend on `frontend/src/data/zones.ts` (use live zones / props).
- Need a single source of truth for zone meta:
  - Either fetch `/api/zones` and cache zone meta list, OR add `GET /api/zones/meta` endpoint returning all zone metadata (micro + legacy) and use it everywhere in UI.
- `SeattleMap.tsx` uses a hardcoded `VENUE_COORDINATES` list for event pins; should be extended to cover new micro venues (or derive from micro-zone `coordinates` when `event.zoneId` is known).

### Versioning / Git tasks for v4.0

- Update versions to `4.0.0` in:
  - `backend/package.json`
  - `frontend/package.json`
  - optionally root `README.md` and backend root endpoint `version` string in `backend/src/index.ts`.
- Commit, tag `v4.0.0`, push to `origin/main`.


