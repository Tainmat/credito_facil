# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **React 19** com **Vite 8**
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes de UI
- **TanStack Query** para requisições HTTP e estado de servidor
- **Zod** + **React Hook Form** para formulários e validação
- **@hello-pangea/dnd** para drag and drop (boards kanban)

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run tests (--passWithNoTests, 50% workers)
npm run test:watch   # Watch mode (25% workers)
npm run test:ci      # CI mode (--runInBand, single-threaded)
npm run generate     # Scaffold a new component via plop
npm run storybook    # Storybook dev server (port 6006)
```

**Run a single test file:**

```bash
npx jest src/components/Main/test.tsx
```

**Run tests for related files (like pre-commit):**

```bash
npx jest --findRelatedTests src/components/Main/index.tsx
```

**Docker:**

```bash
docker compose up    # Full dev environment via Docker
```

## Development Rules

### Components

- Sempre usar **componentes shadcn/ui** antes de criar componentes customizados.
- Instalar via `npx shadcn@latest add <componente>` quando necessário.

### Requisições e estado de servidor

- Usar **TanStack Query** (`@tanstack/react-query`) para todas as requisições HTTP.
- Padrão: `useQuery`, `useMutation` e `useQueryClient` para cache e revalidação.

### Formulários e validação

- Definir schemas com **Zod**.
- Usar **React Hook Form** com `zodResolver`: `useForm` + `zodResolver(schema)` + `FormField` do shadcn.

### Drag and Drop

- Usar **@hello-pangea/dnd** para boards kanban: `DragDropContext`, `Droppable`, `Draggable`.

## Architecture

Next.js 14 App Router application using Styled Components with SSR support.

### src/ layout

```text
src/
├── app/              # Next.js App Router — pages, layout, providers
│   ├── layout.tsx    # Root layout; mounts StyledComponentsRegistry for SSR
│   ├── providers.tsx # Global providers (GlobalStyles)
│   └── <route>/      # Each subfolder is a route (e.g. inicio/)
├── components/       # UI components (one folder per component)
│   └── ComponentName/
│       ├── index.tsx       # Component
│       ├── styles.ts       # styled-components
│       ├── stories.tsx     # Storybook stories
│       └── test.tsx        # Jest + React Testing Library tests
├── lib/              # Shared utilities (registry.tsx for SC SSR)
├── styles/           # Global CSS (createGlobalStyle)
└── types/            # TypeScript augmentations
```

### Key patterns

- **Styled Components SSR**: `src/lib/registry.tsx` wraps the app in `layout.tsx` to collect styles server-side. Required for SC to work with App Router.
- **Path alias**: `@/*` maps to `src/*` (tsconfig paths + jest moduleNameMapper).
- **Component scaffold**: `npm run generate` uses plop to create the full component folder (index, styles, stories, test) from templates in `generators/`.
- **Pre-commit hooks** (Husky + lint-staged): staged files are auto-formatted (Prettier), linted (ESLint --fix), and tested (`--findRelatedTests`) before commit.

### Code style

- Prettier: single quotes, no semicolons, no trailing commas.
- TypeScript strict mode enabled.
- `react/react-in-jsx-scope` is disabled (React 17+ JSX transform).
- `react/prop-types` is disabled (TypeScript handles types).
