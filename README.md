# Reckoning — GitHub Feedback Companion


<img width="1449" height="1249" alt="image" src="https://github.com/user-attachments/assets/0e5d9178-6cc2-46d5-baf1-c5139dd525a9" />



A client-side companion that turns your GitHub activity into a feedback-cycle self-review.

Pull every PR you authored, reviewed, or commented on, and every issue you opened or
participated in within a date range. Then, optionally, point an AI provider at the data to
generate a structured self-review with themes, headline accomplishments, and STAR stories — or
ask freeform questions like _"What auth work did I do?"_ or _"Which PRs took longest to merge?"_

**Everything runs in your browser.** No backend, no telemetry, no servers I control.
Your GitHub PAT and AI key are sent directly from your browser to the respective APIs and
nowhere else.

---

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build & deploy

```bash
npm run build
```

The build emits a static site to `./dist`. Drop that folder onto any static host.

### Deploy to GitHub Pages (one-time setup)

A ready-to-use Actions workflow lives at `.github/workflows/deploy.yml`. To turn it on:

1. Push this repo to GitHub.
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or trigger the workflow manually). The action builds and publishes to Pages.
4. The site appears at `https://<your-username>.github.io/<repo-name>/`.

The Vite config uses `base: './'` so the build works from any subpath without configuration.
A `.nojekyll` is included so Pages doesn't strip files starting with `_`.

### Other hosts

- **Netlify / Vercel / Cloudflare Pages** — point them at the repo, build command `npm run build`,
  publish directory `dist`
- **Self-hosted** — `npx serve dist` or any nginx/Caddy static config

## How it works

### Three views

1. **Contributed** — PRs you authored (`is:pr author:USER`)
2. **Reviewed** — PRs you formally reviewed or left comments on (`reviewed-by:USER` ∪ `commenter:USER`)
3. **Issues** — Issues you opened or participated in (`is:issue involves:USER`)

Each view shows a stat count, expandable cards, and direct links to GitHub.

### AI summarization

When an AI key is present, each view gets a "Generate" button that produces:

- Headline accomplishments with PR/issue links
- 2–4 themes grouping related work
- "By the numbers" paragraph
- One STAR-format story for a standout item

Plus a global Q&A bar that answers freeform questions against all your cached contributions.

### Impact notes

Every PR/issue card has an **Add impact note** button. Jot down the *why this mattered* line
in your own words ("cut p99 latency by 40%", "unblocked the iOS team for two sprints") and
the AI weights those notes heavily when summarizing — they become the source of truth for
significance instead of the AI guessing from titles. Notes persist across sessions per the
"Remember on this device" setting.

### Export for external AI tools

No AI key? The "Take it elsewhere" links next to each view's item count let you:

- **Copy as markdown** — a structured, ready-to-paste prompt for ChatGPT / Claude.ai /
  Gemini, with impact notes inlined as blockquotes.
- **Download JSON** — the raw structured data for scripting or other tooling.

Exports respect the current filters, so you can scope the data before sharing.

### Supported AI providers

- **Anthropic** (Claude Sonnet 4.5)
- **OpenAI** (GPT-4o)
- **Google** (Gemini 2.5 Pro)

Bring your own key for any of them.

## Required GitHub token scopes

Create a [Personal Access Token](https://github.com/settings/tokens/new?scopes=repo,read:org,read:user&description=Reckoning%20Feedback%20Companion)
with these scopes:

- `repo` — read your private repos and orgs (use `public_repo` if you only need public access)
- `read:org` — see contributions in org repos
- `read:user` — read your own profile for the username fallback

A **fine-grained PAT** scoped to read-only on the orgs/repos you care about is the most
secure option.

> **SSO orgs:** If any of your orgs use SAML/SSO, go back to the
> [tokens page](https://github.com/settings/tokens) after creating the token, click
> **Configure SSO** next to it, and authorize each org. Without this, contributions in those
> orgs are silently missing from results.

## Privacy & data handling

- **No server.** Everything is a static SPA. Your tokens go from your browser straight to
  `api.github.com` and your AI provider's API.
- **Storage.** Keys live in `sessionStorage` by default (cleared when the tab closes). The
  "Remember on this device" checkbox switches to `localStorage`. The "Clear data" button on the
  setup screen wipes both.
- **Analytics.** The hosted deployment includes [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/),
  a cookieless privacy-friendly beacon that records aggregate page views and hostname only —
  no user identifiers, no behavior tracking, no cross-site cookies. It's loaded from
  `static.cloudflareinsights.com`. If you self-host, remove the `<script>` tag at the bottom
  of `index.html` to drop it entirely.
- **No other third-party JS** beyond Google Fonts (loaded once at startup).

## Limits to know about

- GitHub's search API caps results at **1,000 per query**. For very long windows on a very
  active user, narrow the date range or filter by repo.
- GraphQL is used wherever cheaper than REST, but a power-user query against many repos can
  still consume a few hundred rate-limit points. The progress screen shows your remaining quota.
- AI calls truncate item descriptions to keep prompts compact. For very long PRs, follow the
  links in the AI's output for full context.

## Project structure

```
src/
  App.jsx                  ← Top-level orchestration of the four screens
  main.jsx                 ← Vite entry
  index.css                ← Tailwind + custom typography
  components/
    ui.jsx                 ← Shared primitives (Button, Input, Logo, Modal, Markdown)
    SetupScreen.jsx        ← Token entry + AI provider selection
    FilterScreen.jsx       ← Date range + repo type-ahead
    FetchProgress.jsx      ← Animated fetch progress
    ResultsScreen.jsx      ← Composes the results view (tabs, header, layout)
    results/
      ContributionCard.jsx ← Single PR/issue card + impact-note UI
      FilterBar.jsx        ← Status/repo/query/sort filter + applyFilters
      SummaryPanel.jsx     ← AI summary generation + display
      QAPanel.jsx          ← Cross-tab freeform Q&A
      ExportBar.jsx        ← Copy-as-markdown / Download-JSON
      AiSettingsModal.jsx  ← Provider + key settings
      feedbackData.js      ← Pure helpers: prompt builders, export formatters
  lib/
    storage.js             ← localStorage/sessionStorage wrapper + JSON helpers
    github.js              ← GraphQL queries + pagination
    ai.js                  ← Provider-agnostic AI calls (with markdown-fence unwrapping)
```

## License

MIT — do whatever you want with it.
