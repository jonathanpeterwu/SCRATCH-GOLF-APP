# Deploying Golf Coach

## The decision

**Ship the web build to Vercel. Keep native on EAS as a second step. Never put an
AI key in the bundle.**

The app is an Expo project targeting iOS, Android, and web from one codebase, but
those three do not deploy the same way, and they are not equally ready:

| Target | Status | What it takes |
|---|---|---|
| **Web** | Ready now | `vercel.json` is already correct. Push to the default branch and connect the repo. |
| **iOS / Android** | One command away, blocked on accounts | `eas build` with the profiles in `eas.json`. Needs an Expo account, and an Apple Developer membership for TestFlight. |
| **AI briefs in production** | Needs a proxy | The key cannot ship in the bundle. See [Secrets](#secrets-the-one-real-blocker). |

Web is the target because it is genuinely finished: the build is clean, the app
works end to end without a single credential, and anyone can open a link. Native
is the same code and the same day's work, but the gate is paperwork, not
engineering, so it should not hold up shipping.

---

## Web (Vercel)

`vercel.json` already carries everything needed:

```json
{
  "buildCommand": "npx expo export:web",
  "outputDirectory": "web-build",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The rewrite matters: the app is a single-page app, so every path has to serve
`index.html` or a refresh on any screen 404s.

To deploy: import the repo at vercel.com, accept the detected settings (they come
from `vercel.json`), and deploy. No environment variables are required — see
Secrets below for why you should not add the AI key.

Locally, the same build:

```bash
npm ci
npm test               # 26 logic checks
npx expo export:web    # -> web-build/
npx serve -s web-build # preview at http://localhost:3000
```

### What "deployed" means for user data

Every golfer's data — ratings, bookings, play log, cached briefs — lives in the
private on-device database (`src/services/db.js`), which is AsyncStorage, which
on web is `localStorage`. So:

- Data is per-browser. The same person on a laptop and a phone has two separate
  sets of courses rated and tee times booked.
- Clearing site data wipes it. There is no server copy.
- Nothing leaves the device, which is the point — but it also means a deploy
  ships no database, no migrations, and no backup story.

That is the right trade while this is a personal app. It stops being right the
moment two people need to see the same booking, which is the same threshold that
forces a real backend (see [What's next](#whats-next)).

---

## Native (iOS / Android)

`eas.json` defines three profiles: `development` (dev client), `preview`
(internal distribution, iOS simulator build), and `production` (auto-incrementing
build numbers).

```bash
npm i -g eas-cli
eas login
eas init          # writes the project id into app.json
eas build --profile preview --platform ios
eas build --profile production --platform all
eas submit --platform ios
```

`app.json` already declares the bundle identifiers
(`com.golfcoach.app` for both platforms). What is missing is only accounts: an
Expo account for EAS, and an Apple Developer membership ($99/yr) before anything
reaches TestFlight or the App Store.

One caveat inherited from the codebase: Apple Sign In is the native auth path,
and web falls back to a guest user. A native build will exercise a sign-in flow
that the web deploy never touches.

---

## Secrets: the one real blocker

`src/services/aiChat.js` reads its key from `process.env.EXPO_PUBLIC_*`, so no key
has to be committed. **That does not make it secret.** Expo inlines
`EXPO_PUBLIC_*` values into the bundle at build time, and on web the bundle is a
file anyone can download and read. A key set that way on a public site will be
scraped.

So:

- **Local or personal device build** — `.env` with `EXPO_PUBLIC_ANTHROPIC_API_KEY`
  is fine. Only you have the bundle.
- **Public web deploy** — do not set it. The app is designed to work without one:
  training briefs fall back to the locally computed version, which is the same
  numbers, just without the prose. Nothing breaks.
- **Public web deploy that needs AI prose** — put the key behind a serverless
  function and point the app at it. On Vercel that is one file:

  ```
  api/coach.js        # reads process.env.ANTHROPIC_API_KEY (no EXPO_PUBLIC_ prefix)
                      # forwards the request to the Anthropic API
                      # returns the completion
  ```

  Then `aiChat.js` calls `/api/coach` instead of `api.anthropic.com`, and the key
  lives only in Vercel's environment. This also fixes a second problem: browsers
  block direct calls to the Anthropic API from a page unless the request opts in
  to browser access, and a proxy sidesteps that entirely.

  That proxy is not built yet. It is the first thing to add if the deployed site
  should write briefs rather than compute them.

---

## CI

`.github/workflows/ci.yml` runs on every push and pull request:

1. `npm ci`
2. `npm test` — the logic suites over the private db, rankings, fit, tee sheets,
   and the training agent
3. `npx expo export:web` — the same command Vercel runs

Step 3 earns its place. The dependency mismatch that stopped the app booting on
web (`expo-font` wanting `expo-modules-core@2+` under SDK 50) was invisible to
the logic tests and to `npm ci`; it only showed up when something actually
bundled the app.

---

## What's next

In the order it will actually matter:

1. **The AI proxy**, if the deployed site should produce written briefs.
2. **A backend**, when either of these becomes true: bookings need to be real
   (you cannot hold a tee time on a device), or rankings need to be
   *community* rankings rather than your own ratings against an editorial prior.
   That is the same decision, and it subsumes the unfinished iCloud sync — the
   private db becomes an offline cache in front of a server rather than the
   source of truth.
3. **Native builds**, once an Apple Developer account exists.
