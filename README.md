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

Choose **Try the demo**, review or edit the fictional starter profile, and submit it.
Use **Suggested matches**, **Community**, and **Edit profile** to navigate. Returning
visitors can reopen saved matches; Community always lists all six neighbors.
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
building verification, and public deployment are not implemented yet.

The server binds only to your computer. It is a development server, without
authentication or public rate limiting; public deployment is a separate step.
