# Goal: G-ROADMAP-001
**Title**: Establish Repository Governance and Registry

## Objective
Establish standard directory structures, execution bounds, and dependency routing registry for the Video to Prompt codebase.

## Scope
- **In Scope**:
  - Creation of `docs/roadmap/goal-registry.yaml`
  - Creation of `docs/roadmap/phases.md`
  - Creation of `docs/governance/execution-policy.md`
  - Creation of `docs/blueprint/system-blueprint.md`
- **Out of Scope**:
  - Implementation of API routes
  - Integration with Gemini API

## Boundaries
- **Allowed Paths**:
  - `docs/**`
- **Forbidden Paths**:
  - `src/**`
  - `public/**`

## Acceptance Criteria
- **AC-01**: `goal-registry.yaml` contains standard Goal ID mapping, states (`DRAFT`, `READY`, etc.), and dependency routing edges.
- **AC-02**: `execution-policy.md` specifies allowed and forbidden directories, credential safety rules, and stop conditions.
- **AC-03**: `system-blueprint.md` details the technical architecture of the backend, including API routes, Youtube extracts, and Gemini integrations.

## Validation Commands
- Run `git status` to verify files are created within allowed boundaries.
- Inspect JSON/YAML syntax checks.

## Evidence Required
- `changed-files.txt`
- `goal-registry-validation.txt`
- `final-goal-report.md`
