---
name: Nutrition
status: final
created: 2026-08-30
updated: 2026-09-02
sources:
  - ../../prds/prd-Nutrition-2026-08-30/prd.md
  - ../../prds/prd-Nutrition-2026-08-30/addendum.md
  - ../../architecture/architecture-Nutrition-2026-08-30/ARCHITECTURE-SPINE.md
  - ../../architecture/architecture-Nutrition-2026-08-30/SOLUTION-DESIGN.md
  - ../../../specs/spec-nutrition/SPEC.md
  - DESIGN.md
---

# Nutrition — Experience Spine

> PWA mobile-first Android Chrome (primaire), iOS Safari (repli scan). Thème sombre par défaut. Maison visuelle / magasin nu. `DESIGN.md` est la référence visuelle ; ce document porte l'IA, les comportements, les états et les parcours. Les spines gagnent en cas de conflit avec un mock.

## Foundation

- **Form-factor** — Mobile portrait, une main, pouce bas (navigation) + pouce haut (contenu).
- **Plateforme cible** — PWA installable Android Chrome ; iOS = repli saisie manuelle code-barres (pas de scan caméra fiable).
- **UI system** — Aucun (Angular Material léger ou composants maison). Tokens dans `DESIGN.md`.
- **Offline** — Garde-manger, Recettes, Plan, Liste, Mode Courses fonctionnels sans réseau. Scan OFF nécessite réseau. Photos recettes et bandeaux : 100 % locaux.
- **Langue** — Français exclusivement.
- **Visuels** — Photos + illustrations persistantes à la maison (Garde-manger, Recettes, Plan, catalogue). Interdit : Mode Courses, Objectifs, Paramètres, liste Courses normale.

## Information Architecture

### Navigation globale

Bottom tab bar (5 onglets) + accès Paramètres depuis overflow (engrenage) sur n'importe quel écran.

| Route | Onglet | Surface principale | Sous-surfaces |
|-------|--------|-------------------|---------------|
| `/pantry` | Garde-manger | Liste stock + bandeau étagères | Détail ligne · Ajout produit |
| `/products` | Produits | Catalogue générique (vignettes OFF) | Détail produit · Liste références · Scanner · Création/édition |
| `/recipes` | Recettes | Liste familles + bandeau plat | Détail + hero · Variantes · Édition · Prompt photo post-création |
| `/plan` | Plan | Vue semaine + bandeau table | Synthèse jour · Picker recette · Picker variante |
| `/shopping` | Courses | Liste éditable | Mode Courses (plein écran) |
| `/goals` | — | Objectifs macros | Accessible depuis Plan (lien « Objectifs ») ou Paramètres |
| `/settings` | — | Export/Import/À propos | Produits archivés |

→ Composition : `mockups/shell-nav.html`, `mockups/products-catalog.html`, `mockups/recipes-list.html`, `mockups/photo-prompt.html`, `mockups/meal-plan.html`, `mockups/macro-synthesis.html`, `mockups/shopping-mode.html`. Spine-only (même contrat, pas de mock dédié) : bandeau Garde-manger, édition photo depuis le détail, preview scan avec vignette.

### Surface 1 — Catalogue produit (2 niveaux)

**Mental model** : « Je cherche un aliment générique ; sous lui je vois les références enseigne. »

| Écran | Contenu | Actions |
|-------|---------|---------|
| Liste produits | Cartes triées (score ↓) · vignette OFF ou picto catégorie · filtre priorité · recherche | Tap carte → détail · FAB → scan |
| Détail produit | Nom générique · priorité · notes · liste références · enseignes recommandées | Ajouter référence · Définir préférée · Archiver |
| Détail référence | Label · enseigne · macros/100g · score · prix · barcode · ingrédients | Éditer · Archiver · Scanner si barcode manquant |
| Scanner | Caméra plein écran · saisie manuelle | Scan → lookup OFF ou ref existante |

**Règles IA** :
- Le scan crée/cherche une **ProductReference**, pas un Product générique seul.
- Barcode existant sur ref archivée → bottom sheet « Restaurer cette référence ? »
- Produit sans `preferredReferenceId` → bandeau discret « Définir une référence pour les macros »

### Picker recherche unifiée (post-MVP)

**Mental model** : « Un seul champ me montre d'abord ce que j'ai, puis les bases officielles, puis le web — dans cet ordre. »

**Cascade verrouillée** (sections vides masquées) :

```
Mon catalogue → Ciqual → OpenNutrition → OFF → FoodRepo → USDA
```

| Section | Label UI | Badge | Offline |
|---------|----------|-------|---------|
| 1 | Mon catalogue | — | ✅ |
| 2 | Ciqual | `Ciqual` | ✅ |
| 3 | OpenNutrition | `OpenNutrition` | ✅ |
| 4 | Open Food Facts | `OFF` | ❌ |
| 5 | FoodRepo | `FoodRepo` | ❌ (clé optionnelle) |
| 6 | USDA | `USDA` | ❌ (clé requise) |

**Surfaces** : picker ingrédient recette · ajout garde-manger · recherche Produits · lookup barcode (OpenNutrition offline avant OFF).

**Comportement** :
- Saisie → sections 1–3 instantanées ; sections 4–6 après debounce ≥ 400 ms (min 3 car.) si réseau
- Spinners indépendants par section online ; pas de mélange inter-sections
- Tap ligne → bottom sheet prévisualisation macros + « Ajouter à mon catalogue »
- Offline → bannière « Recherche en ligne indisponible » sous les sections locales
- Scan barcode → lookup OpenNutrition (offline) puis OFF si réseau — même flow d'import
- Preview scan / import : vignette OFF si l'image est fournie, sinon picto catégorie. Pas de photo prise par l'utilisateur sur un produit.

### Surface 2 — Plan de repas et recettes

**Recettes** — mental model : « Je reconnais mon plat, je choisis vite. »

| Écran | Contenu | Actions |
|-------|---------|---------|
| Liste recettes | Bandeau plat `{components.surface-banner.height}` · cartes vignette `{components.recipe-thumb.size}` + titre + variante | Tap → détail · FAB créer |
| Prompt photo | Post-enregistrement : « Ajouter une photo ? » | Galerie · Caméra · Plus tard |
| Détail recette | Hero 180 px (photo ou placeholder plat) · variantes · macros | Ajouter / changer / retirer photo · Éditer |

**Plan** — mental model inchangé : une recette par créneau.

| Écran | Contenu | Actions |
|-------|---------|---------|
| Vue semaine | Bandeau table · grille 7×3 · créneau rempli = pastille + nom + chip variante | Tap créneau vide → picker recette · Tap rempli → détail |
| Picker recette | Liste recettes · recherche · preview macros/portion | Sélectionner → assigne recette (variante = défaut) |
| Détail créneau | Recette assignée · chip variante (nom ou « Par défaut ») · macros portion | Changer recette · Changer variante · Supprimer |
| Picker variante | Chips scrollables des variantes · étoiles rating · macros/portion | Sélectionner → met à jour `recipeVariantId` |

**Règles comportementales** :
- Assignation initiale : `recipeVariantId = null` → variante résolue = `defaultVariantId`
- Choix variante possible **au plan** (dimanche) ou **au cook** (jour J) — même picker, même UI
- Changement variante recalcule immédiatement la synthèse du jour

### Surface 3 — Synthèse macros

Accessible depuis Plan (panneau bas ou onglet « Synthèse » sur le jour sélectionné) et depuis Objectifs.

| Élément | Comportement |
|---------|-------------|
| Sélecteur jour | Swipe horizontal ou tap sur jour dans la semaine |
| 5 barres macro | kcal, protéines, lipides, glucides, fibres — chacune avec objectif si défini |
| État visuel | Sous objectif (`{colors.macro-under}`) · Atteint ±5% (`{colors.macro-met}`) · Dépassement (`{colors.macro-over}`) |
| Détail | Tap barre → bottom sheet liste des repas du jour avec macros/portion |
| Jour vide | « Aucun repas planifié » — barres à 0, pas d'alerte |

**Règle** : agrégation = somme macros **variante résolue** de chaque créneau planifié.

### Surface 4 — Mode Courses

| Écran | Contenu | Actions |
|-------|---------|---------|
| Liste courses (normal) | Items auto + manuels · badge source · bouton « Mode Courses » | Cocher · Éditer · Régénérer · Mode Courses |
| Mode Courses | Plein écran · items non cochés en premier · gros touch targets | Tap ligne → coche · Swipe retour impossible (bouton « Terminer » fixe) |

**Règles Mode Courses** :
- Masque bottom nav, masque FAB, masque tout sauf liste + compteur « X restants »
- Pas d'animation de coche (feedback instantané : opacité + barré)
- **Aucune photo, aucun bandeau, aucune illustration** (liste normale : pas de pastille non plus dans cet update)
- Items cochés glissent en bas de liste (optionnel) ou restent visibles barrés
- Fonctionne offline
- Bouton « Terminer » haut-gauche → retour liste normale

### Surface 5 — Shell navigation

- Cold start → dernier onglet visité ou Garde-manger (défaut)
- Transitions entre onglets : instantanées (pas de slide)
- Chaque surface atteignable en ≤ 2 taps depuis n'importe quel onglet (1 tap onglet + 0 sous-navigation)
- Paramètres : icône engrenage header droit (tous écrans) → `/settings`

## Voice and Tone

| Contexte | Ton | Exemple |
|----------|-----|---------|
| Succès | Factuel, bref | « Produit ajouté. » |
| Erreur réseau OFF | Explicite, rassurant | « Pas de connexion — saisissez le produit manuellement. » |
| Confirmation destructive | Direct | « Archiver ce produit ? Les recettes existantes le garderont. » |
| Vide | Orientant | « Aucune recette — créez-en une pour planifier votre semaine. » |
| Prompt photo | Neutre, skip OK | « Ajouter une photo ? » |
| Caméra photo refusée | Factuel | « Caméra indisponible — choisissez une image dans la galerie. » |
| Photo échouée | Factuel | « Photo non enregistrée. La recette est sauvegardée. » |
| Mode Courses | Minimal | « 12 articles restants » |

Éviter : encouragements (« Super ! »), culpabilisation macros, jargon technique (IndexedDB, API).

## Component Patterns

| Composant | Usage | Règles comportementales |
|-----------|-------|------------------------|
| `ProductCard` | Liste catalogue | Tap → détail. Long-press → menu rapide (archiver). Tri par score défaut. Vignette OFF si cachée localement ; sinon `FoodCategoryLabel`. Pas de photo user produit. |
| `ProductThumb` | Carte produit, preview scan | 72 px, `cover`. Absente → picto catégorie, pas de trou vide. |
| `ReferenceRow` | Sous produit | Tap → édition ref. Badge « Préférée » sur ref active. |
| `ScannerView` | Scan barcode | Auto-start caméra. Échec < 3s → propose saisie manuelle. Preview : vignette OFF si dispo. |
| `RecipeCard` | Liste recettes | Tap → détail. Long-press → menu (éditer / supprimer). Vignette photo ou `RecipePhotoPlaceholder`. |
| `RecipeHero` | Détail recette | Affiche photo ou placeholder agrandi. Menu « Ajouter / Changer / Retirer la photo ». |
| `RecipePhotoPlaceholder` | Liste + détail + pastille Plan | Même illustration plat pour toutes les recettes sans photo. `aria-hidden`. |
| `SurfaceBanner` | Garde-manger, Recettes, Plan | Toujours visible (liste vide ou remplie). Décoratif, `aria-hidden`. Pas sur les sous-écrans. |
| `PhotoPrompt` | Post-création recette | Recette déjà persistée. Galerie / Caméra / Plus tard. Skip → placeholder. iOS permission caméra refusée → Galerie seulement. |
| `WeekGrid` | Plan semaine | Créneau vide = « + » sans image. Rempli = `PlanSlotThumb` + nom tronqué + chip variante. |
| `PlanSlotThumb` | Créneau Plan | 40 px. Photo recette ou placeholder plat. |
| `VariantChipRow` | Choix variante | Scroll horizontal. Une sélection active. Affiche rating ★. |
| `MacroBarGroup` | Synthèse jour | 5 barres. Objectif non défini = barre sans cible (valeur seule). |
| `ShoppingRow` | Liste courses | Tap zone gauche 52px = toggle checked. Tap nom = éditer quantité. |
| `StoreModeHeader` | Mode Courses | Compteur restants + bouton Terminer. Pas de recherche. |
| `RegenerateBanner` | Liste courses | « Le plan a changé — régénérer les articles auto ? » · Préserve manuels. |
| `EmptyState` | Listes vides | Picto E9 + message + CTA. Coexiste avec `SurfaceBanner` sur Recettes / Garde-manger / Plan. |
| `FoodCategoryLabel` | Catalogue, recherche | Picto + label texte. Fallback visuel produit sans image OFF. |
| `BottomSheet` | Pickers, confirmations | Drag-to-dismiss. Focus piège clavier si formulaire. |

## State Patterns

| État | Surface | Traitement |
|------|---------|------------|
| Cold start | App | Splash < 1s · charge IndexedDB · affiche dernier onglet |
| Offline | Toutes sauf scan | Pas de bannière globale · scan OFF → message explicite |
| Liste vide | Catalogue / Recettes / Plan | `EmptyState` avec CTA création |
| Produit sans ref préférée | Détail produit | Bandeau actionnable « Choisir une référence pour les macros » |
| Scan introuvable OFF | Scanner | « Produit inconnu — créer manuellement » + code pré-rempli |
| Caméra refusée | Scanner | Écran saisie code immédiat, pas de retry forcé |
| Caméra refusée | Prompt photo / détail recette | Galerie / fichier seulement ; message factuel |
| Recette sans photo | Liste, détail, Plan | `RecipePhotoPlaceholder` partout ; pas de case vide |
| Photo / quota échoué | Prompt photo, détail | Recette intacte · placeholder · « Photo non enregistrée. » |
| Image OFF absente | Catalogue, scan | Picto catégorie ; pas de requête image hors import |
| DLC ≤ 3 jours | Garde-manger | Badge `{colors.accent-warning}` + tri optionnel |
| Plan modifié | Liste courses | `RegenerateBanner` si items auto existants |
| Import échoué | Paramètres | Toast erreur · données locales intactes |
| Jour sans repas | Synthèse | Zéros silencieux, pas d'alerte rouge |

## Interaction Primitives

- **Tap** — Action primaire partout.
- **Long-press** — Menu contextuel (archiver, supprimer) sur cartes catalogue et recettes.
- **Swipe horizontal** — Navigation jours dans synthèse macros.
- **Pull-to-refresh** — Listes catalogue et garde-manger uniquement.
- **Bottom sheet** — Pickers (recette, variante, filtre), confirmations non destructives.
- **Dialog modal** — Confirmations destructives uniquement (archiver produit référencé, supprimer recette planifiée).
- **Picker système** — Galerie / caméra pour photo recette (pas le scanner barcode).

**Interdit en Mode Courses** : swipe-to-delete, animations de célébration, notifications toast non critiques, toute image.

## Accessibility Floor

- Contrastes WCAG AA sur `{colors.ink-primary}` / `{colors.surface-base}` (vérifié dans `DESIGN.md`).
- Tout contrôle ≥ 44×44px ; Mode Courses ≥ 52px.
- Labels `aria` sur checkboxes courses, barres macro (valeur + objectif annoncés).
- Pastilles priorité : `aria-label` « Priorité haute » / « Priorité moyenne » / « Priorité basse ».
- Focus visible sur éléments clavier (Paramètres desktop debug).
- `prefers-reduced-motion` : désactive transitions > 100ms.
- Scanner : alternative saisie manuelle toujours visible sans geste.
- Photos recettes : `alt` = titre de la recette. Bandeaux, placeholders et pictos catégorie : `aria-hidden` (le label / titre reste le nom).
- Prompt photo : trois actions nommées, focus dans l'ordre Galerie → Caméra → Plus tard.

## Responsive & Platform

| Plateforme | Comportement |
|------------|-------------|
| Android Chrome PWA | Expérience complète · scan caméra · install prompt |
| iOS Safari | PWA installable · **pas de scan barcode** → « Saisir le code ». Photo recette : picker galerie / caméra système ; permission refusée → galerie seulement |
| Desktop (dev) | Layout mobile centré max 428px · bottom nav conservée |

## Inspiration & Anti-patterns

- **Inspiré de** : listes courses papier (simplicité cocher) · Excel catalogue (2 niveaux produit/référence) · apps liste courses existantes (mode magasin plein écran).
- **Rejeté — MyFitnessPal** : journal repas-par-repas, gamification, scan calories consommées.
- **Rejeté — Duolingo/streaks** : rappels culpabilisants, badges quotidiens.
- **Rejeté — Comparateur multi-enseignes grille** : complexité Excel complète hors MVP.
- **Rejeté — Animations magasin** : confettis à la coche, haptics excessifs.
- **Rejeté — Magazine food** : cartes photo pleine largeur en liste, hero lifestyle par onglet, Unsplash / stock.
- **Rejeté — Photos en rayon** : vignettes en Mode Courses ou sur la liste Courses (cet update).
- **Rejeté — E9.2 tel quel** : l'interdiction totale de photos réalistes est **levée** pour recettes (user) et catalogue (OFF caché). Les illustrations restent non photo.

## Key Flows

### Flow 1 — Ronan planifie sa semaine (UJ-1)

1. Ronan ouvre l'onglet **Plan** dimanche soir.
2. Vue semaine s'affiche ; il tape le créneau « Lundi · Déjeuner ».
3. Bottom sheet picker recette → il choisit « Wrap poulet ».
4. Créneau affiche pastille + « Wrap poulet · Par défaut ».
5. Il tape le chip variante → sélectionne « Lavash » pour lundi déjeuner.
6. Il répète pour 5–7 jours.
7. Il swipe vers la **Synthèse** du lundi — barres macros vs objectifs.
8. Il passe à l'onglet **Courses** → « Générer depuis le plan ».
9. **Climax** : la liste ne contient que les ingrédients manquants (plan − garde-manger), agrégés par produit générique.

Échec : garde-manger vide → liste = total ingrédients du plan.

### Flow 2 — Ronan scanne un yaourt en rayon (UJ-2)

1. Ronan ouvre **Produits** en magasin.
2. Il tape le **FAB Scan**.
3. Scanner s'ouvre ; il vise le code-barres.
4. Lookup OFF → prévisualisation « Danone Skyr 0% » avec macros/100g **et vignette** si OFF fournit une image (copie locale à l'import).
5. Bottom sheet : rattacher à « Skyr nature » existant ou créer nouveau produit générique.
6. Il confirme ; référence créée, proposée comme préférée.
7. **Climax** : en 5 secondes, le produit est dans le catalogue avec macros et vignette, prêt pour recettes.

Échec : produit inconnu OFF → formulaire manuel avec code pré-rempli. iOS → saisie manuelle directe.

### Flow 3 — Ronan fait ses courses (Mode Courses)

1. Ronan ouvre **Courses** au magasin.
2. Il tape « Mode Courses ».
3. Écran plein écran : 18 articles, compteur « 18 restants ».
4. Il tape chaque article au fur et à mesure — coche instantanée, texte barré.
5. **Climax** : compteur « 0 restant » — il tape « Terminer », retour à la liste normale avec tout coché.

Offline : fonctionne sans réseau.

### Flow 4 — Ronan change de variante le jour J (cook)

1. Mardi midi, Ronan ouvre **Plan**, tape le créneau « Déjeuner ».
2. Détail créneau : « Wrap poulet · Lavash » (choisi dimanche).
3. Il décide finalement « Double protéine » → tape chip variante → sélectionne.
4. **Climax** : la synthèse du mardi se met à jour immédiatement (+30g protéines estimées).

### Flow 5 — Navigation shell (transversal)

1. Ronan est sur **Garde-manger**.
2. Il tape l'onglet **Produits** → transition instantanée.
3. Il tape engrenage → **Paramètres**.
4. Retour → reprend **Produits** où il était.

Règle : ≤ 2 taps vers toute surface depuis n'importe où.

### Flow 6 — Ronan ajoute une photo à une recette

1. Dimanche, Ronan crée « Wrap poulet » (titre, ingrédients, première variante).
2. Il enregistre. L'écran **Ajouter une photo ?** s'affiche ; la recette est déjà sauvée.
3. Il tape **Galerie**, choisit l'assiette.
4. Liste Recettes : bandeau plat + vignette à gauche, « Wrap poulet » à droite.
5. Détail : hero de la photo.
6. Il assigne le wrap au lundi-déjeuner : pastille sur le créneau.
7. **Climax** : le plan n'est plus du seul texte — il reconnaît le plat.
8. Mardi, Mode Courses : aucune photo ; il coche comme aujourd'hui.

Échec — Plus tard : placeholder plat en liste, détail et Plan jusqu'à ajout depuis le détail.  
Échec — caméra refusée : Galerie seulement.  
Échec — quota / écriture : recette intacte, placeholder, « Photo non enregistrée. »

## Product-Specific Sections

### Catalogue 2 niveaux — règles d'affichage

- Liste = **Products** uniquement (pas de refs mélangées).
- Détail produit = en-tête générique + section « Références » triées par score ↓.
- Enseigne principale affichée = store de `preferredReferenceId`.
- `recommendedStores[]` = chips ordonnées sous le produit (« Auchan · Carrefour · Lidl »).

### Variantes recette — règles d'affichage

- Liste recettes = familles (`Recipe.title`) + variante par défaut en sous-titre + vignette (photo famille, pas par variante).
- Détail recette = hero puis onglets ou segments par variante.
- Rating ★ sur variante, pas sur famille.
- Macros affichées par portion pour la variante active.
- Une photo par `Recipe` (famille), pas par `RecipeVariant`.

### Visuels persistants

- **Maison** : bandeaux Garde-manger / Recettes / Plan ; photos recettes ; vignettes OFF catalogue + preview scan.
- **Magasin nu** : Mode Courses, liste Courses, Objectifs, Paramètres — zéro image.
- Photo recette : proposée après création (skip OK) ; ajout / changement / retrait au détail.
- Produit : image OFF uniquement, cachée à l'import ; jamais une photo prise par l'utilisateur.
- Import image : resize + WebP à l'entrée, pas d'écran de recadrage (`cover` centré).
- **Backup** : les blobs (photos recettes + vignettes OFF) sont **toujours** dans l'export (clair ou chiffré). Pas de case opt-out. Fichier plus lourd accepté.

### Régénération liste courses

- Banner visible si plan modifié depuis dernière génération.
- Action « Régénérer » : supprime items `auto`, recalcule, **préserve** items `manual` intacts.
- Items manual et auto pour même produit = 2 lignes distinctes (pas de fusion).
