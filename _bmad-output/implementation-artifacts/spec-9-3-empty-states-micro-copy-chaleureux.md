---
title: 'Story 9.3 — Empty states et micro-copy chaleureuxs'
type: 'feature'
created: '2026-09-02'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'd91036afa9bb1f299062209dd53b52b308b6ec87'
context:
  - '_bmad-output/implementation-artifacts/epic-9-context.md'
  - '_bmad-output/implementation-artifacts/spec-9-1-palette-foret-sur-fond-sombre.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les écrans vides sont fonctionnels mais froids ; l'utilisateur ne sait pas toujours quoi faire ensuite.

**Approach:** Enrichir `EmptyState` avec illustrations SVG légères thème nature, micro-copy orientante et CTAs contextuels par surface ; exclure Mode Courses (minimal, sans illustration).

## Boundaries & Constraints

**Always:** Ton orientant, jamais culpabilisant ; CTA vers bibliothèque ou création selon contexte ; illustrations ligne simple teintée forêt.

**Ask First:** Nouvelles surfaces hors liste (recettes, produits, garde-manger, plan/courses).

**Never:** Illustrations en Mode Courses ; animations distrayantes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Catalogue vide | `variant=products` | Illustration + copy chaleureux + CTA bibliothèque | N/A |
| Garde-manger vide | `variant=pantry` | Illustration + bouton ajout | N/A |
| Filtre DLC vide | `showIllustration=false` | Message minimal sans SVG | N/A |
| Mode Courses | store-mode actif | Pas d'EmptyState illustré (inchangé) | N/A |

</frozen-after-approval>

## Code Map

- `empty-state.types.ts` / `empty-state.presets.ts` — variants et micro-copy
- `empty-state-illustration.component.ts` — SVG nature par variant
- `empty-state.component.ts` — titre, message, CTA primaire/secondaire, mode bouton
- `products-page`, `recipes-page`, `pantry-page`, `shopping-list-page`, `recipe-picker-sheet` — intégration

## Tasks & Acceptance

**Execution:**
- [x] Variants + presets chaleureux (products, recipes, pantry, meal-plan, shopping-list)
- [x] Illustrations SVG nature (`aria-hidden`)
- [x] Intégration listes vides recettes, produits, garde-manger, plan/courses
- [x] Filtre garde-manger sans illustration
- [x] Mode Courses inchangé
- [x] Tests composant + specs pages impactées

**Acceptance Criteria:**
- Given liste vide (recettes, produits, garde-manger, plan), when affichée, then illustration SVG nature + copy orientante.
- Given le ton, when lu, then formulé positivement (ex. « Ajoutez votre première recette »).
- Given le contexte, when CTA affiché, then action vers bibliothèque ou création.
- Given Mode Courses, when actif, then pas d'illustration EmptyState (NFR-18).

## Spec Change Log

## Verification

**Commands:**
- `npm test -- --include src/app/features/products/components/empty-state/empty-state.component.spec.ts` -- expected: OK
- `npm test -- --include src/app/features/products/products-page.component.spec.ts` -- expected: OK
- `npm run build` -- expected: OK

## Suggested Review Order

**EmptyState core**

- Presets et variants par surface
  [`empty-state.presets.ts:1`](../../src/app/features/products/components/empty-state/empty-state.presets.ts#L1)

- Illustrations SVG nature
  [`empty-state-illustration.component.ts:1`](../../src/app/features/products/components/empty-state/empty-state-illustration.component.ts#L1)

**Intégrations**

- Garde-manger (bouton + filtre sans illustration)
  [`pantry-page.component.html:3`](../../src/app/features/pantry/pantry-page.component.html#L3)

- Liste courses / plan
  [`shopping-list-page.component.html:37`](../../src/app/features/shopping-list/shopping-list-page.component.html#L37)
