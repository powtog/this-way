# This Way

A learning project that helps neighbors find compatible schedules and friendship
goals, then uses Google-hosted Gemma to suggest outdoor activities.

## Run locally

Requires Node.js 20 or later. No packages need to be installed.

In a zsh terminal, enter your Google AI Studio key privately:

```sh
read -s "GEMINI_API_KEY?Paste your API key, then press Enter: "
export GEMINI_API_KEY
node server.mjs
```

Open http://127.0.0.1:3000 instead of VS Code Live Server. If your key is already
exported in that terminal, only run `node server.mjs`. Stop with Control-C.
The key lasts for the terminal session and is never stored in project files.

Choose **Try the demo** to open the profile editor. First-time visitors start with
blank fields and can optionally choose **Use example answers**. Returning visitors
see their saved answers for review. Choose **Find My Matches** to save and continue.
Use **Suggested matches**, **Community**, and **Edit profile** to navigate.
Community always lists all six neighbors.
Then click a neighbor's activity button to request a live
Gemma suggestion. Only use fictional introductions for this demo: the two
profiles are sent to Google's API. Free API access has usage limits.

## How it works

- `index.html`: the resident form and results area.
- `script.js`: browser storage, schedule filtering, friendship-goal sorting,
  and activity requests. Introductions currently influence activities, not ranking.
- `server.mjs`: serves the public files and handles `POST /api/activity`, keeping
  the API key on the server. Uses `gemma-4-26b-a4b-it`.
- `style.css`: reserved for styling.

Profiles are stored only in this browser's localStorage. All six neighbors are
fictional and assumed to belong to one demo building. Accounts, a shared database,
and building verification are not implemented yet.

## Public hosting (prepared for Render)

The Dockerfile and `render.yaml` deploy the frontend and backend together, so the
browser keeps using `/api/activity` on the same origin. Production binds to
`0.0.0.0` and the hosting service's `PORT`. `/health` is the health check.

1. Push this repository to GitHub.
2. In Render, create a **Blueprint** from that repository using `render.yaml`.
3. Review the paid Starter service and persistent disk shown by Render before
   creating them. Keep exactly one instance: the quota store is single-process.
4. Enter `GEMINI_API_KEY` in Render's secret environment variable prompt. Never
   put its value in Git, Docker build arguments, or browser code.
5. Deploy and open the generated HTTPS URL. Try the profile flow and one activity.
   Confirm `/health` returns 200 and `/.env` returns 404.

See [Render's Blueprint reference](https://render.com/docs/blueprint-spec) for
secret prompts and disk configuration. The disk is required to preserve request
counts across restarts and redeploys. Production refuses to start without an
`AI_QUOTA_FILE` setting; ensure its path is actually on the mounted disk.

Default limits across **all visitors combined**:

- `AI_DAILY_LIMIT=250`: at most 250 provider attempts per UTC calendar day.
- `AI_MINUTE_LIMIT=60`: at most 60 attempts in a rolling minute.
- `AI_CONCURRENCY=4`: at most four outstanding provider requests.

Each browser also gets five new AI attempts per rolling ten minutes, tracked with
an HttpOnly signed cookie. Render generates `VISITOR_COOKIE_SECRET`; keep it
stable across deploys. Clearing cookies or using another browser can bypass this
visitor limit, so the durable shared daily cap remains the quota backstop.
Visitor counters are held in memory and reset on server restart.

Successful suggestions for identical profile fields are cached in memory for ten
minutes (up to 500 entries). Cache hits remain available when limits are reached
and consume no provider or visitor quota. Concurrent identical requests receive
a short retry message instead of triggering duplicate provider calls. Failed
requests are not cached. Cache entries disappear on restart.

Limits return HTTP 429 with `Retry-After`. Reservations persist before contacting
Google; failed provider attempts count too. Storage failures block AI requests.
Static pages and matching continue working after the quota is exhausted. Local
runs use memory unless `AI_QUOTA_FILE` is set. Change the limits in the hosting
environment; each request still allows up to 4,096 output tokens. This caps request
volume, not a dollar amount. An anonymous visitor can exhaust the shared daily
allowance; these limits do not provide accounts or fair per-person allocation.
Do not run multiple replicas against this file store.

Run checks without calling Google:

```sh
node --test *.test.mjs
```

Deployment files are prepared; a live deployment and the hosted secret still
need to be configured in your hosting account.
