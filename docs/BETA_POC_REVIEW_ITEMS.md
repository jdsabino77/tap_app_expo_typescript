# Beta POC — review and follow-up items

Track **non-blocking notices**, **tester feedback**, and **action items** discovered during the **TestFlight POC** for DermaPass by Yasa (Expo). Use this as a living list; close or move items to your issue tracker when you pick them up.

**Related:** [SETTINGS_FEATURES.md](./SETTINGS_FEATURES.md) (beta scope A–C), [TEST_FLIGHT_DEVELOPMENT_AND_UPDATES.md](./TEST_FLIGHT_DEVELOPMENT_AND_UPDATES.md) (shipping builds).

---

## How to use

- Add a row under **Open items** (newest first or by priority — your choice; stay consistent).
- Use **Status:** `Open` | `Scheduled` | `Done` | `Won’t fix` | `N/A`.
- **Source:** e.g. `App Store Connect email`, `TestFlight tester`, `Internal QA`, `expo doctor`.
- When resolved, move the row to **Resolved / archived** (or delete if you prefer a minimal file — keeping history here helps POC retrospectives).

---

## Open items

| Date (UTC) | Source | Item | Severity | Status | Notes |
|------------|--------|------|----------|--------|--------|
| 2026-04-08 | App Store Connect email (post-upload) | **ITMS-90725** — SDK version | Info / future gate | Open | Delivery **succeeded**. Apple: app built with **iOS 18.2 SDK**; starting **2026-04-28**, uploads must use **iOS 26 SDK** (**Xcode 26+**). No action for current TestFlight POC until you adopt a supported EAS/Xcode image and rebuild (see [Expo EAS build infrastructure](https://docs.expo.dev/build-reference/infrastructure/) when Xcode 26 is available). |

---

## Resolved / archived

| Date closed | Item | Outcome |
|-------------|------|---------|
| — | — | *(move rows here when done)* |

---

## Template (copy for new rows)

```markdown
| YYYY-MM-DD | Source | Short title | Low/Med/High | Open | One-line context and links |
```
