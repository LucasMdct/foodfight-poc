# Documentation

Everything written about this POC, indexed. Start here.

---

## Core documents

| Document | What it covers | Read time |
|---|---|---|
| [architecture.md](./architecture.md) | How the engine is built and why each decision was made | 15 min |
| [results.md](./results.md) | Device measurements, findings, and the recommendation | 8 min |
| [testing.md](./testing.md) | The validation protocol, so results can be reproduced | 10 min |
| [troubleshooting.md](./troubleshooting.md) | Symptom → cause → fix | reference |

Project entry point and quick start live in the [root README](../README.md). Version history is in the [changelog](../CHANGELOG.md).

---

## Specs

Written before implementation, one per feature.

| Spec | Subject |
|---|---|
| [poc-runner-skia.md](./specs/poc-runner-skia.md) | The original POC specification and acceptance criteria |
| [2026-07-04-orientation.md](./specs/2026-07-04-orientation.md) | Portrait/landscape selection screen |
| [2026-07-04-dopamine-loader.md](./specs/2026-07-04-dopamine-loader.md) | Animated loading screen |
| [2026-07-04-play-again-button.md](./specs/2026-07-04-play-again-button.md) | Game Over modal and replay flow |

## Plans

Step-by-step implementation plans derived from the specs above.

| Plan | Subject |
|---|---|
| [2026-07-04-dopamine-loader.md](./plans/2026-07-04-dopamine-loader.md) | Loading screen |
| [2026-07-04-play-again-button.md](./plans/2026-07-04-play-again-button.md) | Game Over modal |

---

## Where to go

**Running it for the first time** → [root README → Quick start](../README.md#quick-start)

**Deciding whether this stack is viable** → [results.md](./results.md)

**Changing gameplay code** → [architecture.md](./architecture.md) first; the loop has invariants that are easy to break silently (frame budget, no per-frame React renders).

**Reproducing the measurements** → [testing.md](./testing.md)

**Something is broken** → [troubleshooting.md](./troubleshooting.md)

---

## Archive

[`archive/`](./archive/) holds the seven superseded documents from the pre-restructure layout. They contain **inaccurate descriptions of the codebase** and are kept only for historical reference. Do not use them as a guide.

---

## Conventions

- Docs are written in English. Technical terms stay in their original form (worklet, hitbox, frame budget).
- Specs and plans are prefixed with their date: `YYYY-MM-DD-slug.md`.
- Every user-visible change gets a `CHANGELOG.md` entry under `[Unreleased]` before release.
- When code and docs disagree, the code is right and the doc is a bug.
