# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT

-ALWAYS use shadcn mcp to create ui
-ALWAYS ask user for permission when implementing a plan
-NEVER use emoji for design.
-ALWAYS prioritize server component over client component

## Commands

```bash
pnpm dev        # Start development server at localhost:3000
pnpm build      # Build for production
pnpm start      # Run production build
pnpm lint       # Run ESLint
```

Use `pnpm` as the package manager (see `pnpm-workspace.yaml`).

To add shadcn/ui components:

```bash
pnpm dlx shadcn@latest add <component-name>
```

## Architecture

This is a **Next.js 16 App Router** project using:

- **React 19** with RSC (React Server Components) enabled
- **TypeScript**
- **Tailwind CSS v4** with `tw-animate-css` for animations
- **shadcn/ui** (new-york style, gray base color) for UI components
- **Lucide React** for icons

### Key Conventions

- **Path aliases**: `@/components`, `@/components/ui`, `@/lib`, `@/hooks` (configured in `tsconfig.json` and `components.json`)
- **`cn()` utility**: Use `lib/utils.ts` `cn()` (clsx + tailwind-merge) for conditional class names
- **CSS variables**: All design tokens (colors, radius, sidebar, chart) are defined as CSS custom properties in `app/globals.css` with light/dark variants using oklch color space
- **Dark mode**: Class-based dark mode via `.dark` class (custom variant defined in `globals.css`)
- **Fonts**: Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`) loaded via `next/font/google`

### Structure

- `app/` — Next.js App Router pages and layouts
- `app/globals.css` — Global styles, Tailwind imports, and all CSS variable tokens
- `lib/utils.ts` — `cn()` helper
- `components/ui/` — shadcn/ui generated components (added via CLI)
- `components/` — Custom application components

## Design System

Always dark — no light mode toggle.

**CRT Terminal Theme:**
- `--terminal-bg: #0a0e1a` — page background
- `--terminal-green: #00ff88` — primary accent
- `--electric-blue: #58a6ff` — secondary accent
- `--comment-gray: #6e7681` — muted text

**Custom CSS utilities** (defined in `app/globals.css`):
- `.crt-scanlines` — scanline overlay effect
- `.terminal-glow` — green glow box-shadow
- `.text-glow-green` — text shadow for headings
- `.animate-fade-up` — entrance animation
- `.cursor-blink` — blinking cursor
- `.neo-card` — card with terminal border style

## Typography

- **DungGeunMo** — Korean pixel font, loaded via CDN in `app/layout.tsx`, applied to `body`
- **Geist Sans** (`--font-geist-sans`), **Geist Mono** (`--font-geist-mono`), **Space Mono** (`--font-space-mono`) — via `next/font/google`

## Routes

- `/` — Homepage with `TerminalHero` + features section
- `/tools/json-formatter` — JSON formatter tool (완료)
- `/tools/regex-tester` — Regex Tester (완료)
- `/tools/base64` — Base64 Encoder/Decoder (개발예정 1순위)
- `/tools/uuid-generator` — UUID Generator (개발예정 2순위)
- `/tools/hash-generator` — Hash Generator (개발예정 3순위)
- `/tools/text-diff` — Text Diff Tool (개발예정 4순위)

## Tools Roadmap

개발 완료:
- **JSON Formatter** (`/tools/json-formatter`) — JSON 포맷/검증/Auto-fix
- **Regex Tester** (`/tools/regex-tester`) — 실시간 매칭 하이라이트, 플래그 토글, 캡처 그룹 표시

개발 예정 (순서대로):
1. **Base64 Encoder/Decoder** (`/tools/base64`) — Base64 인코딩/디코딩, JWT 토큰 분해
2. **UUID Generator** (`/tools/uuid-generator`) — v4/v1/v7 UUID 생성, 대량 생성 지원
3. **Hash Generator** (`/tools/hash-generator`) — MD5, SHA-256, SHA-512 해시 생성
4. **Text Diff Tool** (`/tools/text-diff`) — 두 텍스트 비교, 변경사항 시각화

## Components

- `components/hero/terminal-hero.tsx` — **Client**, typewriter animation + tool CTA buttons
- `components/layout/navbar.tsx` — Fixed top navbar with JSON / Regex links (server)
- `components/tools/json-formatter/json-formatter-client.tsx` — **Client**, JSON formatter
- `components/tools/regex-tester/regex-tester-client.tsx` — **Client**, Regex tester (₩→\\ auto-convert)
- `components/ui/` — shadcn components: badge, button, card, progress, scroll-area, separator, tabs

## Data / Lib

- `lib/stages-data.ts` — 6-stage curriculum data (`Stage`, `Section` types)
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

## Tailwind v4 Notes

- Uses `@tailwindcss/postcss` — no `tailwind.config.js`
- Tokens mapped via `@theme inline` block in `globals.css`
- Dark mode: `@custom-variant dark (&:is(.dark *))`
- All colors in oklch color space
