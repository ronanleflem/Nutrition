---
name: Nutrition
status: final
created: 2026-08-30
updated: 2026-08-30
sources:
  - ../../prds/prd-Nutrition-2026-08-30/prd.md
  - ../../prds/prd-Nutrition-2026-08-30/addendum.md
  - ../../architecture/architecture-Nutrition-2026-08-30/ARCHITECTURE-SPINE.md
  - ../../architecture/architecture-Nutrition-2026-08-30/SOLUTION-DESIGN.md
  - ../../../specs/spec-nutrition/SPEC.md
  - DESIGN.md
---

# Nutrition — Experience Spine

> PWA mobile-first Android Chrome (primaire), iOS Safari (repli scan). Thème sombre par défaut. `DESIGN.md` est la référence visuelle ; ce document porte l'IA, les comportements, les états et les parcours.

## Foundation

- **Form-factor** — Mobile portrait, une main, pouce bas (navigation) + pouce haut (contenu).
- **Plateforme cible** — PWA installable Android Chrome ; iOS = repli saisie manuelle code-barres (pas de scan caméra fiable).
- **UI system** — Aucun (Angular Material léger ou composants maison). Tokens dans `DESIGN.md`.
- **Offline** — Garde-manger, Recettes, Plan, Liste, Mode Courses fonctionnels sans réseau. Scan OFF nécessite réseau.
- **Langue** — Français exclusivement.

## Information Architecture

### Navigation globale

Bottom tab bar (5 onglets) + accès Paramètres depuis overflow (engrenage) sur n'importe quel écran.

| Route | Onglet | Surface principale | Sous-surfaces |
|-------|--------|-------------------|---------------|
| `/pantry` | Garde-manger | Liste stock | Détail ligne · Ajout produit |
| `/products` | Produits | Catalogue générique | Détail produit · Liste références · Scanner · Création/édition |
| `/recipes` | Recettes | Liste familles | Détail recette · Variantes · Édition ingrédients |
| `/plan` | Plan | Vue semaine | Synthèse jour · Picker recette · Picker variante |
| `/shopping` | Courses | Liste éditable | Mode Courses (plein écran) |
| `/goals` | — | Objectifs macros | Accessible depuis Plan (lien « Objectifs ») ou Paramètres |
| `/settings` | — | Export/Import/À propos | Produits archivés |

→ Composition : `mockups/shell-nav.html`, `mockups/products-catalog.html`, `mockups/meal-plan.html`, `mockups/macro-synthesis.html`, `mockups/shopping-mode.html`

### Surface 1 — Catalogue produit (2 niveaux)

**Mental model** : « Je cherche un aliment générique ; sous lui je vois les références enseigne. »

| Écran | Contenu | Actions |
|-------|---------|---------|
| Liste produits | Cartes triées (score ↓ par défaut) · filtre priorité · recherche nom | Tap carte → détail · FAB → scan |
| Détail produit | Nom générique · priorité · notes · liste références · enseignes recommandées | Ajouter référence · Définir préférée · Archiver |
| Détail référence | Label · enseigne · macros/100g · score · prix · barcode · ingrédients | Éditer · Archiver · Scanner si barcode manquant |
| Scanner | Caméra plein écran · saisie manuelle | Scan → lookup OFF ou ref existante |

**Règles IA** :
- Le scan crée/cherche une **ProductReference**, pas un Product générique seul.
- Barcode existant sur ref archivée → bottom sheet « Restaurer cette référence ? »
- Produit sans `preferredReferenceId` → bandeau discret « Définir une référence pour les macros »

### Surface 2 — Plan de repas + choix variante

| Écran | Contenu | Actions |
|-------|---------|---------|
| Vue semaine | Grille 7 jours × 3 créneaux (petit-déj / déj / dîner) | Tap créneau vide → picker recette · Tap rempli → détail |
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
| Mode Courses | Minimal | « 12 articles restants » |

Éviter : encouragements (« Super ! »), culpabilisation macros, jargon technique (IndexedDB, API).

## Component Patterns

| Composant | Usage | Règles comportementales |
|-----------|-------|------------------------|
| `ProductCard` | Liste catalogue | Tap → détail. Long-press → menu rapide (archiver). Tri par score défaut. |
| `ReferenceRow` | Sous produit | Tap → édition ref. Badge « Préférée » sur ref active. |
| `ScannerView` | Scan barcode | Auto-start caméra. Échec < 3s → propose saisie manuelle. |
| `WeekGrid` | Plan semaine | Créneau vide = placeholder « + ». Rempli = nom recette tronqué + chip variante. |
| `VariantChipRow` | Choix variante | Scroll horizontal. Une sélection active. Affiche rating ★. |
| `MacroBarGroup` | Synthèse jour | 5 barres. Objectif non défini = barre sans cible (valeur seule). |
| `ShoppingRow` | Liste courses | Tap zone gauche 52px = toggle checked. Tap nom = éditer quantité. |
| `StoreModeHeader` | Mode Courses | Compteur restants + bouton Terminer. Pas de recherche. |
| `RegenerateBanner` | Liste courses | « Le plan a changé — régénérer les articles auto ? » · Préserve manuels. |
| `EmptyState` | Listes vides | Icône + message + CTA contextuel. |
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

**Interdit en Mode Courses** : swipe-to-delete, animations de célébration, notifications toast non critiques.

## Accessibility Floor

- Contrastes WCAG AA sur `{colors.ink-primary}` / `{colors.surface-base}` (vérifié dans `DESIGN.md`).
- Tout contrôle ≥ 44×44px ; Mode Courses ≥ 52px.
- Labels `aria` sur checkboxes courses, barres macro (valeur + objectif annoncés).
- Pastilles priorité : `aria-label` « Priorité haute » / « Priorité moyenne » / « Priorité basse ».
- Focus visible sur éléments clavier (Paramètres desktop debug).
- `prefers-reduced-motion` : désactive transitions > 100ms.
- Scanner : alternative saisie manuelle toujours visible sans geste.

## Responsive & Platform

| Plateforme | Comportement |
|------------|-------------|
| Android Chrome PWA | Expérience complète · scan caméra · install prompt |
| iOS Safari | PWA installable · **pas de scan** → bouton « Saisir le code » en premier plan |
| Desktop (dev) | Layout mobile centré max 428px · bottom nav conservée |

## Inspiration & Anti-patterns

- **Inspiré de** : listes courses papier (simplicité cocher) · Excel catalogue (2 niveaux produit/référence) · apps liste courses existantes (mode magasin plein écran).
- **Rejeté — MyFitnessPal** : journal repas-par-repas, gamification, scan calories consommées.
- **Rejeté — Duolingo/streaks** : rappels culpabilisants, badges quotidiens.
- **Rejeté — Comparateur multi-enseignes grille** : complexité Excel complète hors MVP.
- **Rejeté — Animations magasin** : confettis à la coche, haptics excessifs.

## Key Flows

### Flow 1 — Ronan planifie sa semaine (UJ-1)

1. Ronan ouvre l'onglet **Plan** dimanche soir.
2. Vue semaine s'affiche ; il tape le créneau « Lundi · Déjeuner ».
3. Bottom sheet picker recette → il choisit « Wrap poulet ».
4. Créneau affiche « Wrap poulet · Par défaut ».
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
4. Lookup OFF → prévisualisation « Danone Skyr 0% » avec macros/100g.
5. Bottom sheet : rattacher à « Skyr nature » existant ou créer nouveau produit générique.
6. Il confirme ; référence créée, proposée comme préférée.
7. **Climax** : en 5 secondes, le produit est dans le catalogue avec macros pré-remplies, prêt pour recettes.

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

## Product-Specific Sections

### Catalogue 2 niveaux — règles d'affichage

- Liste = **Products** uniquement (pas de refs mélangées).
- Détail produit = en-tête générique + section « Références » triées par score ↓.
- Enseigne principale affichée = store de `preferredReferenceId`.
- `recommendedStores[]` = chips ordonnées sous le produit (« Auchan · Carrefour · Lidl »).

### Variantes recette — règles d'affichage

- Liste recettes = familles (`Recipe.title`) + variante par défaut en sous-titre.
- Détail recette = onglets ou segments par variante.
- Rating ★ sur variante, pas sur famille.
- Macros affichées par portion pour la variante active.

### Régénération liste courses

- Banner visible si plan modifié depuis dernière génération.
- Action « Régénérer » : supprime items `auto`, recalcule, **préserve** items `manual` intacts.
- Items manual et auto pour même produit = 2 lignes distinctes (pas de fusion).
