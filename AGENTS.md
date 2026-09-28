# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Gemini, Copilot, Cursor, and others) when working with code in this repository.

> Single source of truth for agent behavior. It consolidates `CLAUDE.md`, `README.md`, `package.json` scripts, and observed repo conventions. If `CLAUDE.md` / `GEMINI.md` / `.github/copilot-instructions.md` conflict with this file, follow this file.

## 1. Project Overview

**GitHub Workflow Dashboard** — a Next.js 15 App Router web app for visualizing, monitoring, and managing GitHub Actions workflows across multiple repositories and organizations.

- Live demo: `https://github-workflow-dashboard.vercel.app`
- All user data (GitHub token, repository selection, display settings) is stored **client-side in the browser only** — there is no backend database.
- Key capabilities:
  - Workflow status + history across repos/orgs
  - Recent runs, repository health, auto-refresh
  - GitHub token management + validation
  - Status filtering, repo hide/show (persisted), compact mode, "About Me" (filter by authenticated user)
  - Responsive, mobile-first UI

## 2. Useful Commands

> **Package manager: use Bun (`>=1.3.0`) for all Node.js tasks.** Do not use `npm`/`yarn`/`pnpm`. Scripts defined in `package.json` are runtime-agnostic, so invoke them via `bun run <script>` / `bunx`.
>
> **Shell: Windows PowerShell.** Use `Get-ChildItem` (not `ls -la`), `Remove-Item` (not `rm`), `Copy-Item` (not `cp`), `Move-Item` (not `mv`). Paths accept forward slashes in `bun`/`git`/`go` commands.

| Task | Command |
|------|---------|
| Install dependencies | `bun install` |
| Start dev server (http://localhost:3000) | `bun run dev` |
| Production build | `bun run build` |
| Start production server | `bun run start` |
| Static export to `out/` + serve | `bun run build && bun run export` then `bunx serve out` |
| Lint | `bun run lint` |
| Type-check (no emit, via `tsc`) | `bunx tsc --noEmit` |
| Run all Jest tests | `bun run test` / `bun test` only for Bun-native tests — this repo uses Jest, so prefer `bun run test` |
| Jest watch mode | `bun run test:watch` |
| Integration test (tsx) | `bun run test:integration` |
| Single test file | `bunx jest <path/to/test.ts> --runInBand` |

### Docker

```powershell
docker-compose up --build     # build + start at http://localhost:3000
docker-compose down           # stop + remove containers
```

See `Dockerfile` and `docker-compose.yaml` for image/service definitions.

### Vercel deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%cheney-yan-ifl%2Fgithub-workflow-dashboard)

No extra build config required — default Next.js preset works.

## 3. Technologies

| Layer | Technology / Version |
|-------|----------------------|
| Framework | Next.js `15.5.9` (App Router, `src/app/`), React `19.1.0` + `react-dom` |
| Language | TypeScript `^5` (`strict: true`, `target: ES2017`, path alias `@/*` → `./src/*`, `jsx: preserve`) |
| Styling | Tailwind CSS `^3.4.17`, `tailwind-merge` + `clsx`, `tw-animate-css`, `autoprefixer` + `postcss` |
| UI kit | shadcn/ui pattern (`src/components/ui/` + `components.json`) on Radix UI primitives (`checkbox`, `label`, `select`, `slot`, `switch`) |
| Icons | `lucide-react` — use exclusively, no emoji / no other icon sets |
| State | React Context providers only (no Redux/Zustand): `Theme` → `DisplaySettings` → `GitHubToken` → `RepositorySelection` → `Workflow` |
| Data fetching | Custom `GitHubApiClient` (`src/lib/api/github.ts`) over GitHub REST API via `fetch` |
| Testing | Jest `^30` + `jest-environment-jsdom` + `next/jest`, React Testing Library (`@testing-library/react`, `jest-dom`, `user-event`), `tsx` for integration tests |
| Lint | ESLint `^9` + `eslint-config-next` (`next/core-web-vitals`, `next/typescript`), flat config in `eslint.config.mjs` |
| Hosting | Vercel (demo), Docker / static export (`out/`) for self-host |

### Key paths

```
src/app/            # App Router routes: page.tsx, layout.tsx, loading.tsx, not-found.tsx, settings/
src/components/     # Feature components (WorkflowDashboard, RepositorySelection) + ui/ (shadcn)
src/contexts/       # Theme, DisplaySettings, GitHubToken, RepositorySelection, Workflow providers
src/lib/api/        # github.ts (GitHubApiClient), types.ts, token-validation.ts
src/lib/storage/    # secure-storage.ts (token persistence)
src/lib/            # status-colors.ts, workflow-presets.ts, utils.ts (cn helper)
__tests__/          # Jest unit + integration tests
public/ docs/       # Static assets, screenshots
```

`tsconfig.json` alias: always import via `@/...` (e.g. `@/lib/api/github`), never deep relative `../../../`.

## 4. Architecture Notes (must-follow)

1. **Context hierarchy (outermost → innermost):** `Theme → DisplaySettings → GitHubToken → RepositorySelection → Workflow`. Do not reorder or nest consumers outside their provider. All contexts live in `src/contexts/` and follow the existing provider + `useX()` hook pattern.
2. **API layer:** All GitHub REST calls go through `GitHubApiClient` in `src/lib/api/github.ts`. Types in `src/lib/api/types.ts`. Token validation in `src/lib/api/token-validation.ts`. Never call `fetch('https://api.github.com/...')` directly from components.
   - Error handling via custom `GitHubApiError`. Preserve rate-limit awareness (`X-RateLimit-*` headers, backoff, user-facing message when limited).
3. **Storage:** Persist tokens/settings only via `src/lib/storage/secure-storage.ts`. It prefers secure browser storage and falls back to `localStorage` with a warning — keep that behavior; never store tokens in plain module state, cookies without need, or log them.
4. **Status colors:** All status UI (badges, icons, backgrounds) must use helpers/constants from `src/lib/status-colors.ts`:
   - Success → green, Failure → red, In Progress/Running → blue, Queued/Waiting → yellow/amber, Cancelled/Skipped → gray.
   - Do not hardcode status hex/Tailwind classes elsewhere.
5. **Auto-refresh:** Intervals are 30s / 1min / 2min / 5min, managed by `WorkflowProvider` + `DisplaySettingsProvider`. Clean up timers on unmount; avoid duplicate polling when filters change.

## 5. Best Practices and Guidelines

### General

- Prefer editing existing files over creating new ones. Match surrounding style (Prettier-ish, double quotes, semicolons, Tailwind class order).
- Keep changes minimal and focused. Do not refactor unrelated code, upgrade dependencies, or change build config unless asked.
- Windows-safe: verify parent exists with `Test-Path` before creating files; quote paths with spaces.
- Never commit secrets (`.env` is gitignored — keep it that way). Never log GitHub tokens.

### TypeScript

- `strict: true` — no implicit `any`, handle `null`/`undefined` explicitly. Prefer `unknown` + narrowing over `any`.
- Export interfaces for GitHub API shapes in `src/lib/api/types.ts`; reuse them instead of redefining.
- Use `@/…` alias imports. Avoid `require()`; use ESM `import`.

### React / Next.js components

- Add `'use client'` to any component using hooks, contexts, or browser APIs. Server Components by default elsewhere.
- Feature components (`WorkflowDashboard`, `RepositorySelection`) orchestrate; shared primitives go in `src/components/ui/`.
- Local state (`useState`) for component-only data; cross-component state belongs in the appropriate context.
- Icons: `lucide-react` only. Responsive: mobile-first Tailwind breakpoints (`sm:`, `md:`, `lg:`).
- Accessibility: Radix primitives + semantic HTML, `Label` for inputs, keyboard-focusable controls, sufficient color contrast (don't rely on color alone — pair with icon/text per `status-colors.ts` usage).

### Styling (Tailwind + shadcn)

- Use `cn()` from `src/lib/utils.ts` (`clsx` + `tailwind-merge`) for conditional classes.
- Follow existing neutral design tokens in `tailwind.config.ts` / `src/app/globals.css`. No ad-hoc hex colors for workflow status.
- Variants via `class-variance-authority` where a component already uses it.

### API + data fetching

- Route every GitHub call through `GitHubApiClient`; add new endpoints as methods on that class with typed return values.
- Throw/handle `GitHubApiError` with user-friendly messages. Surface rate-limit and auth failures distinctly (invalid token → prompt re-auth, don't retry-loop).
- Paginate where the API paginates; never assume a single page is complete.
- Cache thoughtfully and respect the auto-refresh intervals — avoid N+1 per-repo request storms; batch/parallelize with `Promise.all` where safe.

### Security

- Tokens: only via `GitHubTokenProvider` + `secure-storage.ts`. Request minimal scopes. Never append tokens to URLs, never log them, never send them to non-`api.github.com` hosts.
- Treat all GitHub API responses as untrusted: escape/render as text (React default), never `dangerouslySetInnerHTML` with API data.
- `fetch` only HTTPS endpoints. Validate user-entered repo names/URLs before using them in requests.
- Client-only secret handling: this is a static/client app — there is no server-side secret vault. Document that limitation rather than inventing one.

### Performance

- Keep the dashboard light under polling: memoize expensive lists (`useMemo`), stabilize callbacks, avoid re-fetch on every render.
- Lazy-load heavy UI (settings panels, charts) with `next/dynamic` where already patterned.
- Images in `public/`; prefer Next `<Image>` for static assets. Avoid layout shift (skeletons in `loading.tsx` pattern).
- Bundle: don't add large deps without need; prefer Radix/Tailwind primitives already present.

### Testing

- New features/fixes need Jest + React Testing Library coverage:
  - API client changes → `__tests__/github-api.test.ts` pattern
  - Dashboard flows → `workflow-dashboard-integration.test.ts` pattern
  - Storage/auth → `secure-storage.test.ts` pattern
- Run `bun run lint` + `bunx tsc --noEmit` + `bun run test` before claiming done. Integration suite via `bun run test:integration`.
- Tests run in `jsdom` (`jest.config.js` + `jest.setup.js`); mock `fetch` and `localStorage` rather than hitting the live GitHub API.

### Git / contributions

- Inspect `git status`, `git diff`, `git log --oneline -10` before committing. Stage only intended files.
- Write concise commit messages matching repo style. Don't amend failed commits — fix and create new ones. No force-push unless explicitly requested.

## 6. Common Pitfalls

- Calling GitHub API directly from components instead of `GitHubApiClient`.
- Hardcoding status colors instead of using `src/lib/status-colors.ts`.
- Consuming a context outside its provider (order matters — see §4.1).
- Forgetting `'use client'` on hook/context components → build/runtime error.
- Relative imports (`../../lib/...`) instead of `@/lib/...`.
- `npm` instead of `bun`; `rm`/`ls` instead of PowerShell equivalents.
- Hitting GitHub rate limits in dev loops — mock in tests, debounce manual refresh.
- Using `next export` alone on newer Next.js — always `bun run build` first (see `package.json`).

## 7. Reference Docs

- `README.md` — features, screenshots (`docs/`), quick-start (npm/Docker/Vercel).
- `CLAUDE.md` — original Claude Code guidance (superseded by this file where they differ).
- `package.json` / `tsconfig.json` / `eslint.config.mjs` / `jest.config.js` — scripts, strictness, lint/test config.
- `Dockerfile`, `docker-compose.yaml`, `next.config.ts`, `components.json`, `tailwind.config.ts`.
