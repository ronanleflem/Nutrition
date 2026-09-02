---
title: 'Story 11.6 — Paramètres clés API et attributions'
type: 'feature'
created: '2026-09-02'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '5c34469'
story_key: '11-6-parametres-cles-api-attributions'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-11-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** API keys and licence attributions were split across separate settings screens; story 11.6 requires a single Sources de données page per FR-38 and NFR-21.

**Approach:** Consolidate USDA/FoodRepo key fields, manual online preference, and all five source attributions on `DataSourcesPageComponent`. Redirect legacy `/settings/api-keys` route. Keep backup export sanitization for keys.

## Boundaries & Constraints

**Always:**
- Clés USDA (Phase 3) et FoodRepo (optionnelle) stockées localement dans `appSettings` (NFR-21).
- Liens inscription gratuite api.data.gov et foodrepo.org.
- Section Attributions : Ciqual (Etalab), OpenNutrition (ODbL), OFF (ODbL), FoodRepo (CC-BY), USDA (domaine public) (FR-38).
- Clés API exclues de l'export backup par défaut (`sanitizeAppSettingsForExport`).

**Never:**
- Envoyer les clés à un backend ou les inclure dans l'export backup par défaut.

## Code Map

- `src/app/features/settings/components/data-sources-page/*` — clés API + attributions unifiées.
- `src/app/core/food-library/food-library-attribution.ts` — copy licences partagées.
- `src/app/core/backup/backup-export-sanitize.ts` — strip keys on export.
- `src/app/features/settings/settings.routes.ts` — redirect `api-keys` → `data-sources`.
- Liens cascade/pickers → `/settings/data-sources#cles-api`.

## Tasks & Acceptance

**Execution:**
- [x] Formulaire clés USDA/FoodRepo + préférence recherche manuelle sur Sources de données.
- [x] Section Attributions avec les 5 sources et licences FR-38.
- [x] OFF licence ODbL explicite dans les attributions.
- [x] Redirect `/settings/api-keys` ; liens app mis à jour.
- [x] Tests composant + export sanitize existants.

**Acceptance Criteria:**
- Given Paramètres → Sources de données, when opening the screen, then USDA and FoodRepo key fields are shown with registration links.
- Given attributions section, when displayed, then all five sources show correct licence text.
- Given export backup, when keys configured, then keys are stripped from payload.

## Verification

- `npm test` — data-sources + backup specs pass.
- `npm run build` — succeeds.
