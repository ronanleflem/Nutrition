# Epic 13 Context: Visuels persistants (maison visuelle / magasin nu)

<!-- Compiled from UX spines PR #25 + sprint-change-proposal-2026-09-02. -->

## Goal

Donner à l’app une **présence visuelle à la maison** (photos recettes, vignettes OFF, bandeaux par surface) tout en gardant les surfaces **magasin nu** sans image (Accueil, onboarding, Mode Courses, liste Courses, Objectifs, Paramètres). Le contrat UX est dans `DESIGN.md` et `EXPERIENCE.md` — les spines gagnent sur les mocks.

## Stories

- Story 13.1: Stockage blobs et pipeline image WebP
- Story 13.2: Photo recette — prompt et CRUD
- Story 13.3: Affichage recettes et plan (vignettes, hero, placeholder)
- Story 13.4: Bandeaux de surface
- Story 13.5: Vignettes OFF catalogue et scan
- Story 13.6: Export/import blobs et accessibilité visuelle
- Story 13.7: Illustrations forêt et ambiance maison

## Requirements & Constraints

- **Maison** : bandeaux Garde-manger / Recettes / Plan ; photos recettes ; vignettes OFF catalogue + preview scan.
- **Magasin nu** : Accueil, onboarding, Mode Courses, liste Courses normale, Objectifs, Paramètres — zéro photo, zéro bandeau illustré.
- `photo-prompt` après **toute** création recette, y compris omelette/custom onboarding (puis `/home`).
- Titre recette non blanc avant persist + prompt.
- Resize + WebP à l'import ; `object-fit: cover` ; pas d'écran crop.
- Backup : blobs **toujours** dans l'export ; import merge : photo import gagne si blob présent, sinon locale ; blob manquant → placeholder/picto + résumé « X restaurées, Y manquantes ».
- Échec photo **remplacement** : conserver l'ancienne photo.
- E9.2 levé pour recettes user + OFF caché ; pictos catégorie E9 restent le fallback produit sans image.
- Français ; IndexedDB ; pas d'API tierce pour les images user.
- Accessibilité : labels priorité visibles, contrastes `DESIGN.md`, `aria-checked` Mode Courses, hit target = carte/créneau/ligne ≥ 44 px.

## Technical Decisions

- Stockage blobs : table Dexie dédiée (ex. `imageBlobs`) ou champs binaires versionnés — à trancher en 13.1 ; `Recipe.photoBlobId`, `ProductReference.thumbBlobId` (noms indicatifs).
- OFF : copie locale de l'image à l'import scan/catalogue — pas de re-fetch réseau à l'affichage.
- Illustrations bandeau + placeholder plat : assets SVG/HTML statiques, une main, palette forêt.
- `RegenerateBanner` et `backup-reminder-banner` = texte seul (exceptions au « aucun bandeau illustré »).
- Onboarding : modifier `OnboardingService` / `recipe-form-page` pour router vers `photo-prompt` avant `/home`.

## UX & Interaction Patterns

- Référence : `_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/`
- Mocks à jour pour palette forêt : `recipes-list`, `photo-prompt`, `meal-plan`, `products-catalog` ; `shell-nav`, `shopping-mode`, `macro-synthesis` obsolètes pour tokens.
- Flows : 6 (photo recette), 7 (UJ-3 backup blobs), 8 (onboarding + photo).

## Cross-Story Dependencies

- **13.1** bloque 13.2, 13.3, 13.5, 13.6.
- **13.2** peut suivre 13.1 ; 13.3 affichage dépend de 13.1 + 13.2 pour photos réelles.
- **13.4** indépendant des blobs (assets statiques).
- **13.5** dépend de 13.1 + flux OFF existant (E2).
- **13.6** dernier — étend E8 + passe a11y globale sur composants 13.x.
- Epic 12 livré ; E9 palette forêt en review — utiliser tokens `DESIGN.md` actuels, pas `#121212`.

## Out of Scope

- Photos utilisateur sur produits.
- Hero OFF sur détail produit.
- Vignettes sur cartes Accueil ou picker recette (texte seul acceptable).
- Thème clair, backend sync images.
