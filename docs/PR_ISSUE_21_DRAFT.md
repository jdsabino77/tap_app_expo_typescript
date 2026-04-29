# PR Draft: Issue 21 Rebrand (Option A)

## Title
Issue 21: Rebrand app surfaces to DermaPass by Yasa (Option A)

## Summary
- Rebrands user-facing app naming from T.A.P to DermaPass by Yasa.
- Updates display name, in-app branding strings, logo text, and key operational docs.
- Intentionally defers technical identifier migration (bundle/package/scheme/native target) to Option B.

## Scope boundaries
- Included: branding/copy/logo/docs updates only.
- Excluded: iOS bundle ID, Android package ID, deep-link scheme, native target/project rename.

## Validation
- `npm run typecheck` passes.
- Lint diagnostics on edited files show no new errors.

## Test plan
- Verify login/signup/welcome/dashboard text uses DermaPass naming.
- Verify logo text is DermaPass where `PassportLogo` renders.
- Verify iOS display name is DermaPass by Yasa on installed build.
- Verify auth/deep links still function with existing `tap://` scheme (unchanged).

## Follow-up (Option B)
- Jira ticket: `Phase 2: Technical Identifier Rebrand (TAP -> DermaPass)`.
- Ticket draft content: `docs/JIRA_OPTION_B_TECHNICAL_IDENTIFIER_REBRAND.md`.
- Linked source issue: https://github.com/jdsabino77/tap_app_expo_typescript/issues/21
