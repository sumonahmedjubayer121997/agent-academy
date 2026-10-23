# Agent Academy — Become an AI Agent Engineer

[![CI](https://github.com/sumonahmedjubayer121997/agent-academy/actions/workflows/ci.yml/badge.svg)](https://github.com/sumonahmedjubayer121997/agent-academy/actions/workflows/ci.yml)

**Live:** https://agent-academy-peach.vercel.app

An interactive learning platform: a personalised, project-driven roadmap from React/ML foundations
to production AI agent engineering. Built with Vite + React 18 + TypeScript + Tailwind CSS.
**No paid APIs required** — everything works offline; progress is stored locally in your browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests (Vitest)
npm run build      # typecheck + production bundle (dist/)
```

## What's inside

| Area | Pages |
|---|---|
| Learn | Landing, Interactive roadmap (SVG dependency graph), Curriculum, Module pages, Lesson pages |
| Track | Dashboard (real statistics only), Diagnostic assessment (5 domains × 3 Qs), Study planner (5/10/15 h/wk), Progress export/reset |
| Practice | Agent Playground (clearly-labelled simulation with approval gate), Projects & portfolio specs, Verified resources |

- **8 phases · 44 modules · ~730 guided hours**, each module with objectives, prerequisites,
  completion criteria, and a portfolio deliverable. 4 modules are optional specialisations.
- **2 complete exemplar lessons** (`The Agent Loop`, `Embeddings & Similarity`) in the full
  nine-section teaching format with interactive demos and knowledge checks.
- **Content lives in `src/content/`** as typed data — curriculum updates never touch app logic.
- `docs/ROADMAP_REPORT.md` is the full analysis & implementation report (timelines, essential vs
  optional tech, architecture, portfolio strategy).

## Architecture (see report for the full picture)

```
src/
  content/     curriculum as typed data (phases, modules, lessons, projects, resources, assessment)
  store/       ProgressProvider — localStorage adapter today, Firebase/Auth later via same interface
  components/  design system, roadmap graph, interactive demos
  pages/       one file per route
```

Planned next iterations (P1/P2 in the report): full lesson content for all 44 modules, Firebase
auth + sync, Mermaid diagrams in lessons, FastAPI backend with a provider-independent LLM layer
(keys server-side only), live-model mode for the Playground, CI.
