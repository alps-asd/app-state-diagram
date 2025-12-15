# Repository Guidelines

## Project Structure & Module Organization
- Root is a pnpm workspace (`pnpm-workspace.yaml`, `tsconfig.base.json`) targeting Node 18+. Shared dev docs live in `dev-docs/`; published docs and static assets are under `docs/`, `public/`, and `_site/`.
- Core packages sit in `packages/`: `cli/` (TypeScript CLI that parses/validates ALPS and generates diagrams) and `mcp/` (Model Context Protocol server that wraps the CLI). Each has `src/`, `dist/`, and its own Jest/TS config.
- Example ALPS profiles for manual/integration checks are in `tests/fake/`. Avoid editing generated `dist/` outputs directly—rebuild instead.

## Build, Test, and Development Commands
- Install deps: `pnpm install` (uses pnpm 9.x). Clean all build outputs: `pnpm -r clean`.
- Build all packages: `pnpm -r build`; package-specific: `pnpm --filter @alps-asd/cli build` or `pnpm --filter @alps-asd/mcp build`.
- Run tests: `pnpm -r test`; coverage: `pnpm -r test:coverage`. For focused work, filter: `pnpm --filter @alps-asd/cli test`.
- MCP dev watch: `pnpm --filter @alps-asd/mcp dev` (TypeScript watch). CLI watch uses `asd -w` against an ALPS file once built.

## Coding Style & Naming Conventions
- TypeScript-first, ES modules where configured (`mcp`), CommonJS in the CLI entry. Prefer 2-space indentation, single quotes, and semicolons as in existing sources.
- Tests use `*.test.ts` colocated with code. Keep CLI surface stable (`src/asd.ts`), and centralize shared parsing/validation logic in dedicated modules (e.g., `parser/`, `validator/`, `generator/`).
- Treat `dist/` as generated; adjust source under `src/` and let `tsc` output artifacts.

## Testing Guidelines
- Jest with `ts-jest` powers unit tests. Add new specs near the implementation and mirror existing naming (`something.test.ts`).
- Use sample ALPS fixtures in `tests/fake/` or add new ones when covering edge cases.
- Aim for coverage parity with surrounding code; include validation and generator paths when altering CLI behavior.

## Commit & Pull Request Guidelines
- Commit messages follow short, imperative summaries similar to `git log` (e.g., “Improve watch mode initialization”). Group related changes per commit when practical.
- PRs should include: a concise description of the change, links to related issues, test evidence (`pnpm -r test` or equivalents), and notes on documentation or generated output updates. Provide screenshots or sample outputs when UI/docs behavior changes.
