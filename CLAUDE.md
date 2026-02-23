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
