# Jira Draft: Phase 2 Technical Identifier Rebrand

## Suggested title
Phase 2: Technical Identifier Rebrand (TAP -> DermaPass)

## Summary
Migrate technical app identifiers from TAP naming to DermaPass naming after stakeholder approval of branding updates. This is intentionally separated from the current branding-only branch to minimize TestFlight and auth risk.

## Background
- Option A (branding-only) is being delivered in `feature/issue-21-app-naming-and-logo-rebrand`.
- Option B is deferred and tracked separately to avoid accidental breakage of existing installs, redirects, and App Store/TestFlight continuity.

## Acceptance criteria
- Define and approve migration strategy for iOS bundle ID and Android package ID changes.
- Define and execute deep-link scheme migration (`tap://` to new scheme), including backward compatibility handling.
- Update auth redirect settings and verification flow in Supabase and app config.
- Evaluate native iOS project/target rename impact and implement only if required.
- Produce regression checklist for TestFlight covering sign-in, magic links, deep links, notifications, and upgrade path from previous builds.
- Document rollback approach and contingency plan.

## Technical scope
- `app.config.js`: identifier and scheme migration plan.
- `ios/`: native target/product naming evaluation and required updates.
- Auth/deep-link integration points: `src/navigation/deep-linking.ts`, Supabase redirect docs/config.
- Release docs: TestFlight and submission runbooks.

## Risks
- Existing installs might not seamlessly upgrade if bundle/package changes are done incorrectly.
- Auth email/magic links can break if redirect URLs and schemes are not migrated together.
- Store metadata and provisioning profiles may need coordinated updates.

## Dependencies
- Final stakeholder sign-off on brand naming and logo from Issue #21.
- Apple/App Store Connect and Supabase configuration windows for coordinated cutover.

## Links
- GitHub Issue: https://github.com/jdsabino77/tap_app_expo_typescript/issues/21
- Branding branch: `feature/issue-21-app-naming-and-logo-rebrand`
