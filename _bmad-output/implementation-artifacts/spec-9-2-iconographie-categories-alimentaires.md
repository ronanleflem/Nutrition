---
title: 'Story 9.2 — Iconographie catégories alimentaires'
type: 'feature'
created: '2026-09-02'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'a537c622f1d54de76b50ce1ab2fd1097a770ada2'
context:
  - '_bmad-output/implementation-artifacts/epic-9-context.md'
  - '_bmad-output/implementation-artifacts/spec-9-1-palette-foret-sur-fond-sombre.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les catégories alimentaires n'ont qu'un libellé texte ; le parcours catalogue et bibliothèque manque de repères visuels rapides.

**Approach:** Mapper les libellés `category` vers un ensemble fin d'icônes SVG monochrome teinté ; composant réutilisable `FoodCategoryLabel` (icône `aria-hidden` + texte) intégré aux cartes, détails et listes de recherche.

## Boundaries & Constraints

**Always:** Icônes ligne simple monochrome ; label textuel catégorie visible ; `aria-hidden` sur SVG ; réutiliser tokens forêt (9.1).

**Ask First:** Nouvelles catégories hors mapping existant.

**Never:** Photos réalistes ; animations ; changement logique recherche.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Produit catalogue | `category: 'LAITIER'` | Icône laitiers + label « LAITIER » | N/A |
| Hit Ciqual | `subtitle: 'fruits'` | Icône fruits + label « fruits » | N/A |
| Hit OpenNutrition | subtitle = marque | Pas d'icône catégorie | N/A |
| Catégorie vide | `category` absent | Rien affiché | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/food-category/resolve-food-category.ts` — mapping libellé → kind (légumes, viande, etc.)
- `src/app/core/food-category/food-category-from-hit.ts` — extraction catégorie depuis hits recherche
- `src/app/core/ui/food-category-label/` — icône SVG + label accessible
- `product-card`, `product-detail`, `food-search-cascade-results`, `food-library-page`, `ingredient-product-picker-sheet`, `archived-products-page` — intégration UI

## Tasks & Acceptance

**Execution:**
- [x] `resolve-food-category.ts` + spec — mapping FR/Ciqual/codes catalogue
- [x] `food-category-label` component — SVG monochrome teinté
- [x] Intégration cartes catalogue + détail produit
- [x] Intégration listes bibliothèque / cascade / picker ingrédient
- [x] `CatalogSearchHit.category` propagé depuis produit

**Acceptance Criteria:**
- Given un Product ou hit Ciqual avec `category`, when affiché en liste/carte, then icône cohérente + label textuel.
- Given le style, when affiché, then ligne simple monochrome teintée (pas de photo).
- Given l'accessibilité, when affiché, then `aria-hidden` sur icône et label catégorie textuel visible.

## Spec Change Log

## Verification

**Commands:**
- `npm test -- --include src/app/core/food-category/resolve-food-category.spec.ts` -- expected: OK
- `npm run build` -- expected: OK

## Suggested Review Order

**Mapping catégories**

- Résolution libellés FR, codes catalogue et catégories Ciqual
  [`resolve-food-category.ts:1`](../../src/app/core/food-category/resolve-food-category.ts#L1)

**Composant UI**

- Icône SVG + label textuel réutilisable
  [`food-category-label.component.ts:1`](../../src/app/core/ui/food-category-label/food-category-label.component.ts#L1)

**Intégrations**

- Carte produit catalogue
  [`product-card.component.html:6`](../../src/app/features/products/components/product-card/product-card.component.html#L6)

- Résultats cascade partagés
  [`food-search-cascade-results.component.html:17`](../../src/app/core/food-library/components/food-search-cascade-results/food-search-cascade-results.component.html#L17)
