# Copilot Instructions

## Project overview
- Next.js 15 App Router lives in `src/app`; the root page (`src/app/page.tsx`) redirects to `/sale`.
- Authenticated routes sit under `src/app/(protected)` and are wrapped by `src/app/(protected)/layout.tsx`, which renders `AccessFrame` + `Navbar`.
- Global providers are composed in `src/components/providers/Providers.tsx` (Cart + User) and installed in `src/app/layout.tsx` alongside `ThemeProvider` and `Toaster`.

## Auth & access control
- JWTs are stored in `localStorage` under `token` and decoded via `src/services/authenticationService.ts` inside `UserProvider`.
- `UserProvider` tracks `lastVisitedPage` in `sessionStorage` when navigating away from `/login`.
- Gate UI with `src/components/accessFrame.tsx` by passing `accessLevel` names that match `authorizationService.accessList()` entries.

## API/services conventions
- All API calls go through `src/services/httpService.ts` (Axios) with base URL `NEXT_PUBLIC_BACKEND`.
- Each service file in `src/services/*` uses a `RESOURCE` prefix and returns `response.data` when needed (see `authorizationService.ts`).
- Shared payload/response types live in `src/services/types.ts`; domain types are in `src/types/*`.

## UI/components patterns
- Reuse `src/components/ui` barrel exports; composite UI lives in `src/components/ui/composite` (e.g., `Navbar`).
- Tailwind class merging is done with `cn` from `src/lib/utils.ts`.
- Screens are in `src/components/screens` and mounted by App Router pages (e.g., `src/app/(protected)/sale/page.tsx` → `components/screens/sale/cashierSalePage.tsx`).

## Dev workflows
- Run the app with `pnpm dev` (uses `next dev --turbopack`), build with `pnpm build`, lint with `pnpm lint`.

## Path aliases
- Use the `@/*` alias from `tsconfig.json` for imports.
