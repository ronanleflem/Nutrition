---
title: 'Story 9.1 — Palette forêt sur fond sombre'
type: 'feature'
created: '2026-09-02'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'a679078a9628fb37f7a699d09dec816cbf5b072d'
context:
  - '_bmad-output/implementation-artifacts/epic-9-context.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le thème sombre actuel est fonctionnel mais visuellement neutre/gris ; l'utilisateur souhaite une identité plus chaleureuse « nature » sans sacrifier le confort magasin.

**Approach:** Réaligner les tokens CSS et `DESIGN.md` sur une palette forêt (fond sombre teinté vert, mousse, terre cuite, crème) ; supprimer le thème clair ; valider les contrastes WCAG AA par tests unitaires.

## Boundaries & Constraints

**Always:** Thème sombre unique ; tokens via `_tokens.scss` ; contrastes WCAG AA ; `accent-positive` et `macro-met` cohérents ; pas de toggle clair/sombre.

**Ask First:** Changement de structure typographique ou refonte composants hors tokens.

**Never:** Thème clair ; dégradés décoratifs ; animations Mode Courses ; backend ou APIs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| App démarrée | `appSettings.theme = 'dark'` | `data-theme="dark"`, surfaces forêt | N/A |
| Settings legacy light | `appSettings.theme = 'light'` | Coercition vers `dark` au apply | N/A |
| Texte principal | `ink-primary` sur `surface-base` | Ratio contraste ≥ 4.5:1 | Test unitaire échoue |
| Accent positif | `accent-positive` sur `surface-base` | Ratio ≥ 3:1 (UI large) | Test unitaire échoue |

</frozen-after-approval>

## Code Map

- `src/styles/_tokens.scss` — source unique des couleurs ; bloc `[data-theme='light']` à supprimer.
- `src/styles/forest-palette.ts` — constantes exportées pour tests de contraste (miroir des tokens).
- `src/styles/forest-palette.contrast.spec.ts` — validation WCAG AA.
- `src/index.html` — `theme-color` meta alignée sur `surface-base`.
- `_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md` — frontmatter `colors` et section Colors.
- `src/app/core/models/app-settings.ts` — type `AppTheme` réduit à `'dark'`.
- `src/app/core/layout/theme/theme.service.ts` — coercition dark ; specs associées.
- `src/app/features/products/components/empty-state/empty-state.component.scss` — crème via `--color-ink-warm`.

## Tasks & Acceptance

**Execution:**
- [x] `src/styles/_tokens.scss` -- palette forêt + aliases manquants (`accent-negative`, `accent-primary`, `accent`, `ink-warm`) -- tokens centralisés
- [x] `src/styles/forest-palette.ts` -- constantes miroir -- tests contraste
- [x] `src/styles/forest-palette.contrast.spec.ts` -- tests WCAG AA -- NFR-17
- [x] `DESIGN.md` -- couleurs forêt documentées -- FR-30
- [x] `src/index.html` -- theme-color `#1A1F1A` -- PWA shell
- [x] `app-settings.ts` + `theme.service.ts` -- dark only + coercition legacy -- pas de thème clair
- [x] `empty-state.component.scss` -- `--color-ink-warm` sur message -- crème empty states

**Acceptance Criteria:**
- Given `DESIGN.md` mis à jour, when l'app s'affiche, then fond sombre teinté vert (`surface-base` ≈ `#121212`–`#1A1F1A`).
- Given la palette forêt, when les accents s'affichent, then mousse `#8FBC8F`, terre cuite `#C4A77D`, crème `#E8E0D4` pour titres/empty states.
- Given les barres macro et boutons primaires, when affichés, then `accent-positive` et `macro-met` alignés sur mousse.
- Given les paires texte/fond critiques, when testées, then contrastes WCAG AA (≥ 4.5:1 corps, ≥ 3:1 grands accents UI).
- Given les paramètres, when l'utilisateur ouvre l'app, then pas de thème clair ni toggle clair/sombre.

## Spec Change Log

## Design Notes

Surfaces dérivées par teinte verte (+4/+8 luminance) plutôt que gris neutre. `--color-ink-warm` réservé aux titres/empty states ; corps reste `ink-primary` pour contraste maximal.

## Verification

**Commands:**
- `npm test -- --include src/styles/forest-palette.contrast.spec.ts` -- expected: tous les tests passent
- `npm test -- --include src/app/core/layout/theme/theme.service.spec.ts` -- expected: coercition dark OK
- `npm run build` -- expected: build sans erreur

## Suggested Review Order

**Palette tokens (point d'entrée)**

- Tokens forêt centralisés — fond teinté vert et accents mousse/terre cuite
  [`_tokens.scss:13`](../../src/styles/_tokens.scss#L13)

- Constantes miroir pour tests de contraste WCAG
  [`forest-palette.ts:1`](../../src/styles/forest-palette.ts#L1)

**Thème dark-only**

- Coercition systématique vers dark, y compris settings legacy
  [`theme.service.ts:12`](../../src/app/core/layout/theme/theme.service.ts#L12)

**Documentation & shell**

- DESIGN.md aligné sur la palette forêt
  [`DESIGN.md:14`](../../_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md#L14)

- Meta theme-color PWA
  [`index.html:8`](../../src/index.html#L8)

**Tests**

- Validation contrastes WCAG AA
  [`forest-palette.contrast.spec.ts:1`](../../src/styles/forest-palette.contrast.spec.ts#L1)

- Coercition legacy light → dark
  [`theme.service.spec.ts:35`](../../src/app/core/layout/theme/theme.service.spec.ts#L35)

