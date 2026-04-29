# Skin analyzer: end-to-end workflow (train → CoreML → DermaPass iOS)

Use this while **`skin_analyzer_model`** training runs or after it finishes. It ties the ML repo to the Expo app.

**Design reference:** [SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md)  
**Export / Xcode details:** [`../../skin_analyzer_model/docs/IOS_DEPLOYMENT.md`](../../skin_analyzer_model/docs/IOS_DEPLOYMENT.md)  
**App integration narrative:** [`../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md`](../../skin_analyzer_model/docs/IOS_APP_INTEGRATION.md)

---

## Phase A — While training is running (this repo)

You can do this **now**; it does not need the checkpoint.

1. **Development client is installed** — `expo-dev-client` is a dependency and listed in `app.config.js` → `plugins`. Standard **Expo Go** will not load custom native CoreML code later; you will use a **dev build**.

2. **Generate the iOS native project** (once, or when config/plugins change):

   ```bash
   cd tap_app_expo_typescript
   npm run prebuild:ios
   ```

   This creates **`ios/`** at the project root. Open **`ios/*.xcworkspace`** in Xcode when you need to add the **`.mlpackage`** or debug native code.

3. **Optional — run the dev build on simulator/device** (after `prebuild:ios`):

   ```bash
   npm run run:ios
   ```

   Or start Metro with the dev client: `npx expo start --dev-client` (after installing the dev build on a device/simulator).

---

## Phase B — After training finishes (`skin_analyzer_model`)

Training writes a run folder:

`outputs/runs/unet_segmentation_<YYYYMMDD_HHMMSS>/`

Important files:

- **`best_model.pth`** — use this for export when validation improved.
- **`latest_checkpoint.pth`** — last epoch (if you prefer).

### B1. Export CoreML

From **`skin_analyzer_model`** (venv active), **replace the checkpoint path** with your real run:

```bash
cd /path/to/skin_analyzer_model
source .venv/bin/activate
mkdir -p exports

python export_to_coreml.py \
  --checkpoint outputs/runs/unet_segmentation_YYYYMMDD_HHMMSS/best_model.pth \
  --output_path exports/pigment_segmentation.mlpackage \
  --model_type segmentation
```

(`convert_to="mlprogram"` requires **`.mlpackage`**. If you pass `...mlmodel`, the script rewrites it to **`...mlpackage`**.)

Confirm **`exports/pigment_segmentation.mlpackage`** exists (it is a **folder** bundle).

### B2. Add the model to the Xcode app

1. Open **`tap_app_expo_typescript/ios/*.xcworkspace`** in Xcode.
2. Drag **`pigment_segmentation.mlpackage`** (the whole bundle) into the app project (e.g. from `skin_analyzer_model/exports/`).
3. Enable **Copy items if needed** and the **DermaPass** app **target**.
4. Build once; Xcode compiles the package into the app bundle. Verify **Build Phases → Copy Bundle Resources** includes **`pigment_segmentation.mlpackage`**.

### B3. Native bridge (implemented)

- **Local package:** [`../modules/tap-skin-analyzer/`](../modules/tap-skin-analyzer/) — Swift loads **`pigment_segmentation.mlmodelc`**, resizes crop to **512×512**, returns **`maskBase64`** + **`affectedPercent`**.
- **JS:** [`../src/services/skin-analyzer/pigmentation.ts`](../src/services/skin-analyzer/pigmentation.ts) calls the module on **iOS**; Android/web stay **not available** until another runtime exists.
- **UI:** [`../app/(app)/skin-analyzer.tsx`](../app/(app)/skin-analyzer.tsx) — image picker → analyze → mask + **single** aggregate %.

After adding the module or changing native code: **`npm install`**, then **`cd ios && pod install`**, then rebuild in Xcode.

---

## Phase C — Sanity checks

| Check | Notes |
|-------|--------|
| Input size | Export uses **512×512** by default; preprocessing in the app must match training. |
| Demo vs production | Demo-trained weights validate **pipeline** only; replace checkpoint + re-export for production. |
| App size | Large **`.mlpackage`** increases IPA size; quantize in export if needed (see `export_to_coreml.py`). |
| Android | CoreML is **iOS-only**; keep stub UX on Android until another runtime exists. |
| **“Affected %” meaning** | Today = **binary pigment mask** over the crop, **not** a specific diagnosis (see **SKIN_ANALYZER_IOS_DESIGN.md** → *What the current % means*). |

---

## Phase D — Planned: condition-specific estimates (Melasma, Lentigines, Freckles, PIH)

**Goal:** Show user-facing breakdowns such as “~5% Freckles, ~40% Solar lentigines” — **only** after `skin_analyzer_model` is trained and validated for those **classes**.

### D1. Product / clinical (decide before labeling)

- **Exclusive classes (chosen for v1 UI):** one class per pixel (+ background) so the app can list **row-per-condition %** without drawing overlaps. Annotation guidelines should define how to **priority-pick** a single label where two conditions might co-occur visually.
- Photography **SOP** (distance, lighting) — same as training or degrade gracefully.
- **Regulatory / copy:** educational estimates only (see design doc).

### D2. Data & training (`skin_analyzer_model`)

- **Annotations:** pixel-accurate **multi-class** and/or **multi-channel** masks, or weaker image-level tags + optional localization — see design doc tradeoffs.
- **Classes (initial list):** Melasma, Solar lentigines, Freckles (ephelides), PIH, + background/other as needed.
- **Deliverables:** updated training configs, metrics **per class**, export script producing Core ML output(s) that match an agreed **JS/native schema** (`conditions[]` in **SKIN_ANALYZER_IOS_DESIGN.md**).

### D3. App & bridge (`tap_app_expo_typescript`)

- Extend **`tap-skin-analyzer`** + **`PigmentAnalysisResult`** to return **`conditions?: { id, label, areaPercent }[]`** (and optional confidences later).
- Update **`skin-analyzer.tsx`** to list **per-condition** rows + disclaimer; keep **feature flag** / schema version if old bundles still ship.

### D4. Docs to update when you start D2

- `skin_analyzer_model/PROJECT_SUMMARY.md` / **`docs/TRAINING_GUIDE.md`** (or a short **MULTI_CLASS_PIGMENT.md**) — dataset layout, class definitions, export I/O.

**Design reference for the full plan:** [SKIN_ANALYZER_IOS_DESIGN.md](./SKIN_ANALYZER_IOS_DESIGN.md) (*Roadmap: condition-specific breakdown*).

---

## Quick command summary

| Step | Where | Command |
|------|--------|---------|
| Prebuild iOS | `tap_app_expo_typescript` | `npm run prebuild:ios` |
| Run native iOS app | `tap_app_expo_typescript` | `npm run run:ios` |
| Start Metro for dev client | `tap_app_expo_typescript` | `npx expo start --dev-client` |
| Export CoreML | `skin_analyzer_model` | `python export_to_coreml.py --checkpoint .../best_model.pth --output_path exports/pigment_segmentation.mlpackage --model_type segmentation` |

---

## If you re-run `prebuild`

Regenerating **`ios/`** can **overwrite** manual Xcode changes. After `expo prebuild --clean`, you may need to **re-add** the **`.mlpackage`** to the target, or automate via a **config plugin** (future improvement).
