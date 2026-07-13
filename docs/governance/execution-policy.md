# Execution and Governance Policy

This policy governs AI Agent execution parameters for this repository.

## 1. General Constraints
- **No Embedded Credentials**: Never commit API keys (`GEMINI_API_KEY`), tokens, or secrets. All values must be loaded from `process.env`.
- **Convention Adherence**: Code must strictly match existing patterns (Tailwind CSS v4 inline imports, Next.js 16 App Router structures, TypeScript typing strictness).
- **No Boundary Violations**: Agents are prohibited from modifying files in forbidden paths unless the goal specifies it.

## 2. Allowed and Forbidden Boundaries
- **Allowed Coding Boundary**:
  - `src/app/api/**`
  - `src/app/image-to-prompt/**`
  - `src/app/image-to-video/**`
  - `src/app/storyboard/**`
  - `src/app/kling/**`
  - `src/app/runway/**`
  - `src/app/seedance/**`
  - `src/app/veo/**`
  - `src/app/page.tsx`
  - `src/app/globals.css`
  - `src/components/**`
- **Forbidden Boundary**:
  - `secrets/**`
  - `.github/workflows/**`
  - `node_modules/**`

## 3. Stop Conditions
Agents MUST stop immediately and return `HUMAN_REQUIRED` status if:
- Credentials or environment setup is missing.
- Conflicting API/design requirements exist.
- Required to edit files inside forbidden paths.
- Third-party packages must be installed without explicit authorization.
