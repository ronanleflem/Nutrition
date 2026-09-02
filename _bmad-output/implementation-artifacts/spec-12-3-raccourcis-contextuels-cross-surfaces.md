---
title: 'Story 12.3 — Contextual cross-surface shortcuts'
type: 'feature'
created: '2026-09-02'
status: 'in-progress'
review_loop_iteration: 0
baseline_commit: '10e7f564064a1cf874afac897e08105cad3447ec'
context:
    - '{project-root}/_bmad-output/implementation-artifacts/epic-12-context.md'
    - '{project-root}/_bmad-output/implementation-artifacts/spec-12-2-onboarding-première-recette.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Getting a product into the pantry, a recipe, or the manual shopping list still means leaving the catalog or recipe list and hunting through another tab.

**Approach:** Long-press or ⋮ on Product cards and recipe cards/fiches opens a French action menu; each action opens a minimal bottom sheet on the current route (add to pantry, use in a recipe, add to the manual list).

## Boundaries & Constraints

**Always:**
- Surfaces: catalog `ProductCard`; recipe list cards; recipe detail (« fiche »). ⋮ (44px, `aria-haspopup="menu"`) and long-press (~500 ms; cancel if pointer moves). Tap on the title/body still opens detail.
- Product target — three actions: « Ajouter au garde-manger », « Utiliser dans une recette », « Ajouter à la liste manuelle ».
- Recipe target — « Ajouter au garde-manger » (pick one default-variant ingredient if several) and « Ajouter à la liste manuelle » (all default-variant ingredients). Hide « Utiliser dans une recette ».
- Each action is a sheet overlay: backdrop + × dismiss like `pantry-add-sheet`. Stay on the current URL. Success: factual French line (« Produit ajouté. »).
- Reuse `PantryService.addItem`, `ShoppingListService.addManualItem`, `RecipesService.createRecipeWithFirstVariant` / a new append-to-default-variant write. Prefill product on pantry and shopping sheets.
- French UI, IndexedDB only, WCAG AA / 44px. No sixth tab.

**Ask First:**
- Drag-to-dismiss on existing sheets (none implement it today).
- Showing « Utiliser dans une recette » on recipe cards, or assigning a recipe to the meal plan from this menu.

**Never:**
- Call `ShoppingListService.refresh()` from products/recipes/home.
- Backend, auth, cloud, new Dexie stores, Mode Courses changes, swipe-to-delete, fake tutorial recipes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Product pantry | ⋮ → garde-manger; qty submitted | `addItem` with that productId; stay on `/products`; « Produit ajouté. » | French error; sheet stays open |
| Product recipe new | Utiliser → « Nouvelle recette » + qty | Real Recipe + Base variant + that ingredient; stay; « Recette créée. » | Missing preferred ref → French error (existing validation) |
| Product recipe existing | Utiliser → pick recipe + qty | Ingredient appended to default variant; stay; « Ingrédient ajouté. » | Same preferred-ref / qty errors |
| Product shopping | ⋮ → liste manuelle + qty | `addManualItem`; stay; « Article ajouté. » | French error; no `refresh()` |
| Recipe shopping | Fiche ⋮ → liste manuelle | One manual item per default-variant ingredient; stay | Empty variant → French empty message |
| Recipe pantry | Fiche ⋮ → garde-manger | If 1 ingredient, pantry sheet prefilled; if several, pick then sheet | N/A |
| Long-press vs tap | Press < 500 ms / move while holding | Opens detail / no menu | N/A |
| Dismiss | Backdrop or × | Sheets close; URL unchanged | N/A |

</frozen-after-approval>

## Code Map

- `src/app/features/products/components/product-card/product-card.component.html` L1–20 — whole-card `<a>`; add ⋮ + long-press; stop navigation on menu control.
- `src/app/features/products/components/product-card/product-card.component.ts` L17 — emit `shortcut` (or host-level menu). `products-page.component.html` L110–114 hosts the list.
- `src/app/features/recipes/recipes-page.component.html` L7–15 — inline `.recipes-page__card` `<a>`; same ⋮ / long-press. Add `min-height: var(--spacing-touch-min)` in `recipes-page.component.scss` L14–24.
- `src/app/features/recipes/components/recipe-detail-page/recipe-detail-page.component.html` L7–10 — header next to « Modifier »: ⋮ for the open recipe.
- `src/app/features/pantry/pantry-add-sheet.component.ts` L20–28 — add `prefillProductId` / `prefillProductName` inputs; skip picker when set (edit mode already shows a name L23–25).
- `src/app/features/shopping-list/components/shopping-item-sheet/shopping-item-sheet.component.ts` L47–54 — add prefill productId; hide product `<select>` when prefilled. Service: `addManualItem` L71–74 (`shopping-list.service.ts`). Do **not** call `refresh()`.
- `src/app/features/meal-plan/components/recipe-picker-sheet/` — reuse to pick an existing recipe (meal-plan-page L51–57).
- `src/app/features/pantry/pantry.service.ts` L76–78 — `addItem({ productId, quantityG, expiryDate?, location? })`.
- `src/app/features/recipes/services/recipes.service.ts` L37–42 — `createRecipeWithFirstVariant` for « Nouvelle recette ». Add `appendIngredientToDefaultVariant(recipeId, { productId, quantityG })` wrapping a new `DatabaseService` write that `bulkPut`s one `createRecipeIngredient` after `validateRecipeIngredients` (L1767–1788).
- `src/app/features/pantry/pantry-add-sheet.component.html` L1–21 — copy backdrop/sheet markup + SCSS for the **new** action-menu sheet (no shared BottomSheet exists).
- `src/app/core/ui/confirm-dialog/` — do **not** use for these actions (destructive-only).
- New: `src/app/core/ui/context-shortcuts/` (or `features/shortcuts/`) — menu sheet + thin orchestrator service; host pages open pantry/shopping/recipe sheets.
- Tests to copy: `home-page.component.spec.ts` (Dexie + `[data-card]` clicks); `products-page.component.spec.ts`; `recipe-form-page.component.spec.ts` L57–88.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/core/database/database.service.ts` -- `appendIngredientToDefaultVariant` -- stay-in-context « Utiliser dans une recette »
- [x] `src/app/features/recipes/services/recipes.service.ts` -- wrap append + reload list -- same API family as create
- [x] `src/app/core/ui/context-shortcuts/` -- menu sheet + long-press helper + specs -- FR-12.3 entry
- [x] `src/app/features/pantry/pantry-add-sheet.*` + shopping-item-sheet -- prefill product -- reuse qty forms
- [x] `src/app/features/products/components/product-card/` + products-page -- ⋮ / long-press + host sheets -- catalog AC
- [x] `src/app/features/recipes/recipes-page.*` + recipe-detail-page -- ⋮ / long-press + recipe actions -- fiche AC
- [x] Specs for I/O matrix (Dexie seed, no `refresh()` from products/recipes)

**Acceptance Criteria:**
- Given a Product card, when the user long-presses or taps ⋮, then the three actions appear and each opens a sheet without changing route.
- Given a recipe card or fiche, when the user opens the same menu, then pantry (one ingredient) and manual-list (all default-variant ingredients) run without changing route.
- Given a successful shortcut, when the sheet closes, then the matching IndexedDB row exists and a factual French confirmation is shown.

## Spec Change Log

## Design Notes

Product card is an `<a>` today — split so ⋮ is a `<button>` (stopPropagation) and the title block remains the detail link. Long-press lives on the card article, not the ⋮.

« Nouvelle recette » from a product: title = product name, variant « Base », `defaultPortions: 1`, that ingredient only — a real `Recipe` row, same as 12.2 omelette (no tutorial fake).

Do not invent drag-to-dismiss; match pantry sheet close behavior.

## Verification

**Commands:**
- `npm test -- --include src/app/core/ui/context-shortcuts --include src/app/features/products --include src/app/features/recipes --include src/app/features/pantry --include src/app/features/shopping-list --include src/app/core/database/database.service.recipes.spec.ts` -- expected: all pass
- `npm test` -- expected: full suite green
- `npm run build` -- expected: production build succeeds

**Manual checks:**
- `/products` ⋮ → each of the three sheets; URL stays `/products`; detail tap still works.
- Long-press a recipe card → pantry / liste; `/recipes/:id` ⋮ same.
- After shortcuts, Garde-manger / Recettes / Courses show the new rows.
