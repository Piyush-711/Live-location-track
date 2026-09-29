# Local — Travel Companion

React/TypeScript discovery UI with a Spring Boot REST API. Features include nearby places, maps, device-local bookmarks, country information, weather/FX lookups, and routes when a provider is configured.

The bundled place/country catalogues are sample data. The specification PDFs describe a target architecture, not completed capabilities. This is not a certified emergency directory or a complete offline navigation application.

## Run and verify

Requirements: Node.js 22.12+ (22 or 24 LTS), Java 21, Maven 3.9+.

```sh
npm ci
npm test
npm run build
npm run backend:test
npm run backend:run
# In another terminal:
npm run dev
```

Vite serves port 3000 and proxies `/v1` to port 8080. Spring applies Flyway migrations and uses a local H2 database under its working directory's `data/` folder. Public browsing works without authentication configuration; private endpoints remain protected.

`npm run preview` and GitHub Pages serve only the frontend. Neither starts the API, supplies accounts, or hosts provider proxies. Set `VITE_API_BASE_URL` at build time for a separate backend.

## Project flow

1. `App.tsx` manages cities, tabs and modals, loading views on demand. `useLiveLocation` owns one GPS watcher and rejects stale callbacks after location changes.
2. Explore requests nearby places for the selected category, query and coordinates. Results are radius-filtered and ordered by distance then ID. Availability failures may use bundled sample data; rejected requests remain errors.
3. Leaflet markers use DOM text rather than interpolating remote names as HTML. Image URLs are restricted to HTTP(S). Request guards prevent older responses from overwriting the selected city/search.
4. UI bookmarks are **local to this browser profile**. Each place has a separate storage key; Web Locks serialize same-place writes across tabs, and change subscriptions refresh readers. Legacy arrays remain readable. Saving requires HTTPS or localhost with Web Locks support.
5. The separate `/v1/me/saved` API validates bearer tokens and persists records under the authenticated identity. Conditional SQL updates reject stale writes without a global application lock.
6. Reports are validated and persisted by the backend. Failed submission is never presented as received by a review team.
7. Routes require real provider results. The step guide advances manually; it does not detect GPS turns. Missing routes and offline downloads display unavailable states.

Backend packages separate discovery, markets, content, personal data, feedback, routing and utilities. Controllers validate requests; services enforce rules; JDBC stores saved places/reports; Flyway owns schema changes. Public place/market repositories still use small bundled catalogues.

## Multi-user backend

Configure these **server** environment variables:

| Variable | Purpose |
| --- | --- |
| `AUTH_ISSUER` | HTTPS issuer of trusted JWT access tokens |
| `AUTH_AUDIENCE` | Required API audience |
| `AUTH_JWK_SET_URI` | HTTPS public signing-key endpoint |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact frontend origins |
| `DATABASE_URL` | Production JDBC URL, e.g. `jdbc:postgresql://db:5432/local_travel` |
| `DATABASE_USER`, `DATABASE_PASSWORD` | Credentials from the deployment secret store |
| `DATABASE_POOL_SIZE` | Connection maximum per replica, default 10 |
| `PORT` | HTTP port, default 8080 |

Use `SPRING_PROFILES_ACTIVE=prod` in production. All replicas must share PostgreSQL and identity-provider configuration. H2 files are for single-instance development. Back up the database and validate restoration before storing real accounts.

The resource server validates JWT signature, issuer, audience, token lifetime, mandatory expiration and a nonempty subject. The account key derives from issuer plus subject, never a caller-supplied account header. There are no default accounts, passwords, cookie sessions or development authentication bypasses. See [Spring Security JWT documentation](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html).

Every private request requires `Authorization: Bearer <access-token>`.

| Operation | Request | Result |
| --- | --- | --- |
| List | `GET /v1/me/saved?limit=100&offset=0` | Caller-owned active records with bounded pagination |
| Read | `GET /v1/me/saved/{placeId}` | State (including tombstone) and `ETag` |
| Create | `PUT /v1/me/saved/{placeId}`, `If-None-Match: *` | Create only if absent |
| Re-save | `PUT` with current `If-Match` | Conditional save |
| Remove | `DELETE` with current `If-Match` | Conditional tombstone |

Missing conditions return 428; stale conditions return 412. Refetch and reconcile conflicts rather than blindly overwriting. Repeating the current state with its current ETag does not increment its version. `Idempotency-Key` replay is not implemented. Personal responses use `Cache-Control: no-store`.

**The frontend has no login/account-sync UI yet.** Browser bookmarks are not authenticated cloud saves. Integrating your identity provider's login/logout flow is still required; local bookmarks must not be uploaded or reassigned to an account implicitly.

## Providers and frontend configuration

Copy `.env.example` to `.env.local`. `VITE_*` values are public and embedded in JavaScript; never put secrets there.

| Setting | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend prefix, normally `/v1` |
| `VITE_PHOTON_BASE_URL` | Photon-compatible geocoding/search gateway |
| `VITE_OSRM_DRIVING_BASE_URL` | OSRM service with a car routing graph |
| `VITE_OSRM_WALKING_BASE_URL` | Separate OSRM service with a foot routing graph |

Public Photon and OSRM driving demos are development defaults only. Production builds require configured endpoints. Prefer a same-origin gateway with shared caching, rate limits, timeouts and server-held credentials. Weather/FX still use public read APIs directly; tiles/images/fonts also require external services. Coordinates, requested map areas and queries are sent to their respective providers.

Browser provider calls share bounded caches, per-key request coalescing, body-read timeouts, a four-request concurrency cap and a bounded queue. These controls do not replace fleet-wide gateway limits. Public [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) disallows client autocomplete, so it is not used for autocomplete. [OSRM's public demo](https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy) has best-effort availability.

## Deployment limits

- Use HTTPS, exact CORS origins, and ingress request/body/time limits. Apply shared abuse controls. Reports also have a bounded per-instance rate limiter using the direct peer address; arbitrary forwarded headers are not trusted.
- Budget database connections across replicas. Uniqueness and conditional SQL updates protect saved state across replicas. Automated concurrency tests use H2; validate migrations and transaction behavior against your PostgreSQL deployment and benchmark your intended load before launch.
- Seeds remain in memory. There is no production spatial index, editorial-review service, retention scheduler or measured user-capacity guarantee.
- Country hotlines are bundled content, not a live verified feed. Map hospital categories do not prove 24-hour emergency capability.
- No service worker, offline map download, cryptographic pack verification or offline routing graph is implemented. Former simulated-success flows are now unavailable. Stale FX cache data is marked; weather failures surface; unsupported countries never silently become Japan.
- CI uses `npm ci` and runs frontend tests, type checking/build, and backend tests before Pages deployment. Pages does not deploy Spring.

See [openapi.yaml](openapi.yaml) and regression tests under `src/` and `backend/src/test/`.
