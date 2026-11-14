# Lumen — Adaptive Learning

Lumen is an installable, responsive learning workspace for laptop and mobile browsers. It includes Supabase password sign-in for one existing account, synced learning data and private PDF storage, AI quiz generation with Gemini, document-grounded tutor answers with page citations, and adaptive quiz difficulty.

## Run the interface

```sh
npm ci
npm run dev
```

The first screen is sign-in for the existing account; account creation and email-code recovery are intentionally unavailable. Configure Supabase before running the production app. `npm run build` creates the static Vite frontend.

The regular Vite dev server also provides local `/api/*` handlers for Gemini generation, PDF indexing, and tutor requests. Server-only environment values are loaded from `.env.local` by the Vite config and are not exposed as client-side `VITE_` variables. Do not expose the development server to the public internet.

## Configure Supabase and Gemini

1. Use the existing Supabase project and enable email/password sign-in. In Supabase Auth settings, disable new-user sign-ups and email confirmation. Confirm the existing account in the Supabase dashboard if it is still unconfirmed. The app intentionally has no signup or forgot-password email flow.
2. Apply [`supabase/migrations/20261110000000_learning_foundation.sql`](./supabase/migrations/20261110000000_learning_foundation.sql) and then [`supabase/migrations/20261111000000_grant_authenticated_permissions.sql`](./supabase/migrations/20261111000000_grant_authenticated_permissions.sql) in the Supabase SQL Editor. The first enables `pgvector`, creates tables, the private PDF bucket, RLS policies, quotas, and vector search. The second explicitly grants the authenticated role the SQL privileges required by those policies and app features.
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend.
4. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `GEMINI_API_KEY` as server-side environment variables in Vercel. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. Gemini text generation uses the Interactions API; if the default model returns a temporary overload response, the app retries with `gemini-3.5-flash-lite`.
5. Deploy the Vite app and all routes under `api/` to Vercel. For local serverless API testing, use the Vercel CLI (`vercel dev`) with the same environment variables; the Vite-only `npm run dev` command serves the frontend.
6. Set Vercel environment variables for the Vite Supabase URL/key and the server-side Supabase URL/key plus Gemini API key. Keep the Gemini key server-side; never use a `VITE_` prefix for it.

Supabase remains the app's authentication, PostgreSQL database, private PDF storage, and vector search provider. Turning off sign-ups and email confirmation avoids signup emails; it does not remove Supabase. If the existing account's password is forgotten, an administrator must reset it in the Supabase dashboard or email recovery must be restored with working SMTP.

Never put `GEMINI_API_KEY` in a `VITE_` variable or expose a Supabase service-role key in the browser. AI routes require a valid Supabase access token; database functions enforce daily per-user limits for quiz generation, document indexing, and tutor requests.

## Use Lumen like a mobile or desktop app

1. Deploy to Vercel and open the HTTPS site once in a supported browser. Installable apps need HTTPS (localhost also works for development).
2. On desktop Chrome or Edge, use the install icon in the address bar or the browser menu's **Install Lumen** option.
3. On Android Chrome, open the browser menu and tap **Install app** or **Add to Home screen**.
4. On iPhone/iPad Safari, tap **Share → Add to Home Screen**.

The installable app opens in its own window and caches the basic app shell. Signing in, AI features, PDF uploads, and saved data still require an internet connection.

### Open the local app on a phone (without deploying)

1. Connect the computer and phone to the same Wi-Fi network.
2. In the project folder on the computer, run:

   ```sh
   npm run dev:network
   ```

3. Find the computer's IPv4 address (`ipconfig` in Windows PowerShell; look for **IPv4 Address** on the active Wi-Fi adapter).
4. On the phone, open `http://<computer-ip>:5173` (for example, `http://192.168.1.25:5173`).
5. If the page does not load, allow Node.js/Vite through the computer's private-network firewall and confirm both devices are on the same Wi-Fi.

This is a local development preview, not a public website. Use the demo to preview it. Browser security does not allow service-worker installation from an ordinary local-network HTTP address; install it on a phone after the app has an HTTPS hosting URL. Real Supabase email links also require the local computer/phone URL to be allow-listed in Supabase Auth redirect settings.

## Current limits

- The demo quiz runner works without a Supabase project; dashboard examples in demo mode are sample content only.
- AI quiz generation, private PDF upload/indexing, document-grounded quizzes and tutor answers require Supabase, Gemini, and the migration above.
- PDF indexing supports selectable text, up to 15 MB, 300 pages, and 120,000 extracted characters. Scanned PDFs require OCR, which is not included.
- Adaptive difficulty currently uses recent accuracy for the selected topic; deeper topic mastery and question-level scheduling are future improvements.
- AI output is schema-validated, but should still be reviewed as generated study material.
