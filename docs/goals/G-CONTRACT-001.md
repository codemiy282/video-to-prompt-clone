# Goal: G-CONTRACT-001
**Title**: Define API and Error Contracts

## Objective
Define the precise input/output payloads, schema parameters, HTTP status codes, and error codes for the `/api/generate-prompt` endpoint.

## Scope
- **In Scope**:
  - Creation of `docs/contracts/api-contracts.md` detailing payload schemas.
  - Definition of standard error shapes and codes (`BAD_REQUEST`, `GEMINI_API_ERROR`, etc.).
- **Out of Scope**:
  - Writing functional Next.js route handlers.
  - Interacting with the Google Gemini SDK.

## Boundaries
- **Allowed Paths**:
  - `docs/contracts/**`
- **Forbidden Paths**:
  - `src/**`
  - `public/**`

## Acceptance Criteria
- **AC-01**: `docs/contracts/api-contracts.md` contains markdown schema descriptions of the Multipart Form data structure for file uploads.
- **AC-02**: The contract defines request payload specifications for YouTube URL strings.
- **AC-03**: The contract defines exact JSON response structures for both success (`200 OK`) and error conditions (`400`, `500`), including retryable status indicators.

## Validation Commands
- Inspect files inside `docs/contracts/` for syntactic markdown compliance.

## Evidence Required
- `changed-files.txt`
- `final-goal-report.md`
