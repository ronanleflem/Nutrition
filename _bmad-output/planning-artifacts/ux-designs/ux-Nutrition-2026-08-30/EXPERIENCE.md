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
  - ../../../project-context.md
  - DESIGN.md
---

# Nutrition — Experience Spine

> PWA mobile-first Android Chrome (primaire), iOS Safari (repli scan). Thème sombre par défaut. Maison visuelle / magasin nu. `DESIGN.md` est la référence visuelle ; ce document porte l'IA, les comportements, les états et les parcours. **Les spines gagnent en cas de conflit avec un mock.**

> **Glossaire** — Les termes `Product` / `ProductReference` / `Recipe` / `RecipeVariant` suivent le SPEC et l'architecture (catalogue 2 niveaux), pas le glossaire simplifié PRD §3 (« Produit » = une entité).

## Foundation

- **Form-factor** — Mobile portrait, une main, pouce bas (navigation) + pouce haut (contenu).
- **Plateforme cible** — PWA installable Android Chrome ; iOS = repli saisie manuelle code-barres (pas de scan caméra fiable).
- **UI system** — Aucun (Angular Material léger ou composants maison). Tokens dans `DESIGN.md`.
- **Offline** — Garde-manger, Recettes, Plan, Liste, Mode Courses, Accueil fonctionnels sans réseau. Scan OFF nécessite réseau. Photos recettes et bandeaux : 100 % locaux.
- **Langue** — Français exclusivement.
- **Visuels** — Photos + illustrations persistantes à la maison (Garde-manger, Recettes, Plan, catalogue). **Magasin nu** (zéro image) : Accueil, onboarding, Mode Courses, liste Courses normale, Objectifs, Paramètres.

## Information Architecture

### Navigation globale

Bottom tab bar (5 onglets, **pas** de 6ᵉ onglet Accueil) + shell header sur les écrans principaux :

- **Titre** — Sur `/home` : titre statique « Accueil ». Sur tout autre écran shell : titre = lien vers `/home` (`aria-label` « {titre écran} — Accueil »).
- **Paramètres** — Icône engrenage header droit sur **tous** les écrans shell (y compris Accueil) → `/settings`.
- **Rappel export FR-24** — Bannière texte shell (`backup-reminder-banner`) ou carte Accueil « Sauvegarde » ; ce n'est **pas** un `surface-banner` illustré.

| Route | Onglet | Surface principale | Visuels | Sous-surfaces |
|-------|--------|-------------------|---------|---------------|
| `/home` | — | Tableau de bord cartes texte | **Magasin nu** | — |
| `/onboarding` | — | Wizard 3 étapes (chrome masqué) | **Magasin nu** | Pack Ciqual · Bibliothèque · Omelette / recette custom |
| `/pantry` | Garde-manger | Liste stock + bandeau étagères | Maison | Détail ligne · Ajout produit |
| `/products` | Produits | Catalogue générique (vignettes OFF) | Maison | Détail produit · Références · Scanner · CRUD |
| `/recipes` | Recettes | Liste familles + bandeau plat | Maison | Détail + hero · Variantes · Édition · `photo-prompt` |
| `/plan` | Plan | Vue semaine + bandeau table | Maison | Synthèse jour · Pickers recette / variante |
| `/shopping` | Courses | Liste éditable | Magasin nu | Mode Courses (plein écran) |
| `/goals` | — | Objectifs macros | Magasin nu | Depuis Plan ou Paramètres |
| `/settings` | — | Export / Import / À propos | Magasin nu | Produits archivés · Export · Import |

**Références visuelles** (spines gagnent ; `shell-nav`, `shopping-mode`, `macro-synthesis` = palette E1 obsolète pour les tokens) :

| Mock | Illustre |
|------|----------|
| `mockups/shell-nav.html` | Shell header, bottom nav, engrenage |
| `mockups/products-catalog.html` | `product-card`, `priority-badge`, vignette OFF |
| `mockups/recipes-list.html` | `recipe-card`, `surface-banner`, `recipe-placeholder` |
| `mockups/photo-prompt.html` | `photo-prompt` post-création |
| `mockups/meal-plan.html` | `surface-banner` Plan, `plan-slot-thumb`, créneaux |
| `mockups/macro-synthesis.html` | `macro-bar`, synthèse jour |
| `mockups/shopping-mode.html` | `shopping-row`, `store-mode-header` |

Spine-only (pas de mock dédié) : bandeau Garde-manger, Accueil cartes, onboarding, édition photo détail, preview scan, `backup-reminder-banner`.

### Surface 0 — Accueil (`/home`)

**Mental model** : « En un coup d'œil : repas du jour, courses, DLC, sauvegarde. »

| Carte | Contenu | Tap |
|-------|---------|-----|
| Repas du jour | Créneaux du jour + titres recettes (texte seul) | `/plan` |
| Courses | « N articles restants » ou vide | `/shopping` |
| DLC proche | Compte + noms produits ≤ 3 jours | `/pantry?filter=expiring` |
| Sauvegarde | Si rappel FR-24 actif | `/settings/export` |

**Règles** :
- Pas de 6ᵉ onglet ; Accueil = cold start par défaut (sauf réglage « Masquer l'accueil au démarrage » → Garde-manger).
- **Aucune** vignette recette, vignette OFF ni `surface-banner` sur Accueil (magasin nu).
- Picker recette et synthèse macros : si vignettes utilisées ailleurs, ici **texte seul** sur les cartes Accueil.

### Surface 0b — Onboarding (`/onboarding`)

**Mental model** : « Première ouverture : objectifs optionnels, catalogue de base, première recette. »

| Étape | Contenu | Actions |
|-------|---------|---------|
| 1 | Macros journaliers (optionnel) | Enregistrer · Passer |
| 2 | Pack Ciqual starter ou visite bibliothèque | Importer · Aller à la bibliothèque |
| 3 | Omelette guidée ou recette personnalisée | Créer omelette · Créer ma recette |

**Règles** :
- Shell chrome masqué (pas de bottom nav, pas de header shell).
- **Magasin nu** : pas de bandeau ni photo pendant le wizard.
- Après création de la **première** recette (omelette ou custom) : enchaîner sur `photo-prompt` comme toute création, puis `/home` et `onboardingCompleted = true`.
- Relance depuis Paramètres : même wizard, chrome masqué.

### Surface 1 — Catalogue produit (2 niveaux)

**Mental model** : « Je cherche un aliment générique ; sous lui je vois les références enseigne. »

| Écran | Contenu | Actions |
|-------|---------|---------|
| Liste produits | Cartes triées (score ↓) · vignette OFF ou picto catégorie · filtre priorité · recherche | Tap carte → détail · FAB → scan |
| Détail produit | Nom générique · priorité · notes · liste références | Ajouter référence · Définir préférée · Archiver |
| Détail référence | Label · enseigne · macros/100g · score · barcode | Éditer · Archiver · Scanner si barcode manquant |
| Scanner | Caméra (Android) ou saisie (iOS) | Scan → lookup OFF ou ref existante |

**Règles IA** :
- Le scan crée/cherche une **ProductReference**, pas un Product générique seul.
- Barcode existant sur ref archivée → bottom sheet « Restaurer cette référence ? »
- Produit sans `preferredReferenceId` → bandeau « Définir une référence pour les macros »
- Ref préférée archivée sans image exploitable → vignette = picto catégorie (même règle que sans préférée).
- Détail produit : pas de hero OFF pleine largeur.

### Picker recherche unifiée (post-MVP)

**Mental model** : « Un seul champ, cascade verrouillée Mon catalogue → Ciqual → OpenNutrition → OFF → FoodRepo → USDA. »

Détail comportemental : voir addendum post-MVP / `epics-post-mvp.md`. Sections vides masquées ; debounce ≥ 400 ms pour sources online.

### Surface 2 — Plan de repas et recettes

**Recettes** — mental model : « Je reconnais mon plat, je choisis vite. »

| Écran | Contenu | Actions |
|-------|---------|---------|
| Liste recettes | Bandeau plat · cartes vignette + titre + variante | Tap → détail · FAB créer |
| `photo-prompt` | Post-enregistrement : « Ajouter une photo ? » | Galerie · Caméra · Plus tard |
| Détail recette | Hero (photo ou placeholder) · variantes · macros | Photo · Éditer |

**Plan** — une recette par créneau.

| Écran | Contenu | Actions |
|-------|---------|---------|
| Vue semaine | Bandeau table · grille 7×3 · pastille + nom + chip variante | Tap créneau → picker / détail |
| Picker recette | Liste avec **mêmes vignettes** que liste Recettes (ou texte seul si contrainte perf) | Sélectionner → assigne recette |
| Picker variante | Chips scrollables · rating texte | Sélectionner → met à jour `recipeVariantId` |

**Règles comportementales** :
- Titre recette **obligatoire** (non blanc) avant persist et avant `photo-prompt`.
- `recipeVariantId = null` → variante résolue = `defaultVariantId`.
- Choix variante au plan (dimanche) ou au cook (jour J) — même picker.
- `photo-prompt` : toute sortie sans fichier (retour système, picker annulé, arrière-plan) = équivalent **Plus tard** (placeholder, recette déjà sauvée). Picker vide → rester sur le prompt.

### Surface 3 — Synthèse macros

Accessible depuis Plan et Objectifs. Barres + mot d'état textuel. Jour vide = zéros silencieux. Détail repas au tap barre.

### Surface 4 — Mode Courses

Liste normale + Mode Courses plein écran. **Magasin nu** strict.

**Règles** :
- `regenerate-banner` = bandeau **texte** autorisé sur liste normale (exception à « aucun bandeau illustré »).
- Liste vide : `EmptyState` + CTA « Générer depuis le plan » si plan non vide ; Mode Courses désactivé ou no-op si 0 article.
- Mode Courses : masque nav, FAB, images ; tap ligne entière = coche (`aria-checked`).

### Surface 5 — Shell navigation

**Cold start** (ordre strict) :
1. Si `onboardingCompleted !== true` **et** zéro recette → `/onboarding`.
2. Sinon si `hideHomeOnStartup === true` → `/pantry`.
3. Sinon → `/home`.
4. Pas de persistance « dernier onglet » au MVP.

- Transitions entre onglets : instantanées.
- Chaque surface onglet atteignable en ≤ 2 taps depuis n'importe où (1 tap onglet + 0 sous-navigation ; Accueil via titre header = 1 tap).

## Voice and Tone

| Contexte | Ton | Exemple |
|----------|-----|---------|
| Succès | Factuel, bref | « Produit ajouté. » (`aria-live="polite"`) |
| Erreur réseau OFF | Explicite, rassurant | « Pas de connexion — saisissez le produit manuellement. » |
| Confirmation destructive | Direct | « Archiver ce produit ? Les recettes existantes le garderont. » |
| Vide | Orientant | « Aucune recette — créez-en une pour planifier votre semaine. » |
| Prompt photo | Neutre, skip OK | « Ajouter une photo ? » |
| Caméra refusée | Factuel | « Caméra indisponible — choisissez une image dans la galerie. » |
| Galerie refusée | Factuel | « Accès aux photos refusé — vous pourrez ajouter une photo plus tard depuis la recette. » |
| Photo échouée (ajout) | Factuel | « Photo non enregistrée. La recette est sauvegardée. » |
| Photo échouée (remplacement) | Factuel | « Photo non enregistrée. » (ancienne photo conservée) |
| Import terminé | Factuel | « Import terminé — {n} photos restaurées, {m} manquantes. » |
| Export lourd | Factuel | « La sauvegarde peut être volumineuse — patientez. » |
| Mode Courses | Minimal | « 12 articles restants » |

Éviter : encouragements (« Super ! »), culpabilisation macros, jargon technique.

## Component Patterns

> Clé canonique = kebab-case alignée sur `DESIGN.md` frontmatter.

| Composant | Usage | Règles comportementales |
|-----------|-------|------------------------|
| `bottom-nav` | 5 onglets shell | Masqué onboarding + Mode Courses. Onglet actif mousse. Pas d'Accueil dans la barre. |
| `fab-scan` | Écran Produits | Visible Produits uniquement. Masqué Mode Courses. Tap → `scanner-overlay`. |
| `shell-header` | Tous écrans shell | Titre → `/home` sauf sur Accueil. Engrenage → `/settings`, zone ≥ 44 px. |
| `home-card` | Accueil | Carte entière cliquable ≥ 44 px. Texte seul, pas d'image. |
| `backup-reminder-banner` | Shell FR-24 | Texte sous header. Masqué onboarding + Mode Courses. Lien export. |
| `product-card` | Liste catalogue | Tap → détail. Long-press → archiver. Vignette OFF ou `food-category-label`. |
| `product-thumb` | Carte, preview scan | 72 px `cover`. `alt=""` décoratif — le nom produit visible suffit. Absente → picto catégorie. |
| `reference-row` | Sous produit | Tap → édition. Badge « Préférée ». |
| `scanner-overlay` | Scan barcode | Android : auto-start caméra &lt; 3 s puis saisie. iOS : saisie directe, pas de prompt caméra. Preview vignette OFF si dispo. |
| `recipe-card` | Liste recettes | Tap → détail. Long-press → menu. Vignette ou `recipe-photo-placeholder`. Hit = carte entière. |
| `recipe-hero` | Détail recette | Photo ou placeholder agrandi. Menu Ajouter / Changer / Retirer photo. Retrait = immédiat + toast ; placeholder partout. |
| `recipe-photo-placeholder` | Liste, détail, Plan | Illustration plat partagée. `aria-hidden`. |
| `surface-banner` | Garde-manger, Recettes, Plan | Toujours visible (vide ou rempli). `aria-hidden`. Sous la bannière FR-24 si les deux visibles. |
| `photo-prompt` | Post-création recette (+ onboarding) | Recette persistée. Galerie / Caméra / Plus tard. Caméra refusée → Galerie seule. Galerie refusée → Plus tard seul. Focus Galerie → Caméra → Plus tard. |
| `week-grid` | Plan semaine | Créneau vide = « + » `{colors.ink-secondary}`. Rempli = `plan-slot-thumb` + nom + chip. |
| `plan-slot-thumb` | Créneau Plan | 40 px visuel ; hit = créneau entier. `aria-hidden` si photo — nom recette annoncé. |
| `variant-chip-row` | Choix variante | Chips ≥ 44 px. Rating « n/5 » texte. |
| `macro-bar-group` | Synthèse jour | 5 barres. `aria` valeur + objectif + état textuel. |
| `shopping-row` | Liste courses | Ligne entière `aria-checked`. Tap gauche 52 px ou ligne = toggle. Tap nom = éditer qté. |
| `store-mode-header` | Mode Courses | Compteur + Terminer. Pas de recherche. |
| `regenerate-banner` | Liste courses | Texte seul si plan modifié et items auto existants. Préserve manuels. |
| `empty-state` | Listes vides | Picto décoratif + titre + copy `{colors.ink-secondary}` + CTA. Coexiste avec `surface-banner` sur les 3 onglets maison. |
| `food-category-label` | Catalogue, recherche | Picto `aria-hidden` + label texte visible. |
| `bottom-sheet` | Pickers, confirmations | Drag dismiss. Focus trap sur tout sheet interactif. `prefers-reduced-motion` : pas de slide si réduit. |

## State Patterns

| État | Surface | Traitement |
|------|---------|------------|
| Cold start | App | Splash &lt; 1 s · règles Surface 5 · pas de dernier onglet |
| Focus clavier | Toutes | Anneau focus visible (pas réservé au debug desktop) |
| Offline | Toutes sauf scan | Bannière shell si hors ligne · scan OFF → message explicite |
| Chargement | Accueil | « Chargement… » `role="status"` |
| Erreur chargement | Accueil | Message + « Réessayer » |
| Liste vide | Catalogue / Recettes / Plan / Garde-manger / Courses | `EmptyState` + CTA adapté |
| Liste vide | Objectifs | Champs vides, barres sans cible, pas d'alerte |
| Recherche vide | Catalogue | « Aucun résultat » + effacer filtre |
| Produits archivés vide | Paramètres | « Aucun produit archivé » |
| Onboarding étape 1–3 | `/onboarding` | Progression « Étape n sur 3 » ; erreur étape en alert |
| Onboarding skip macros | Étape 1 | Passer → étape 2 sans sauver objectifs |
| Onboarding abandon custom | Formulaire recette | Retour onboarding étape 3 si `from=onboarding` |
| Produit sans ref préférée | Détail produit | Bandeau « Choisir une référence pour les macros » |
| Scan introuvable OFF | Scanner | « Produit inconnu — créer manuellement » + code pré-rempli |
| Caméra refusée | Scanner (Android) | Bascule saisie code |
| Caméra refusée | `photo-prompt` / détail | Galerie seulement + message |
| Galerie refusée | `photo-prompt` / détail | Plus tard / retrait bouton Caméra + message |
| Recette sans photo | Liste, détail, Plan | `recipe-photo-placeholder` ; pas de case vide |
| Photo échouée (premier ajout) | Prompt / détail | Recette intacte · placeholder · message |
| Photo échouée (remplacement) | Détail | **Ancienne photo conservée** · message |
| Format image illisible | Import photo | Même traitement que échec remplacement ou ajout selon contexte |
| Image OFF absente | Catalogue, scan | Picto catégorie |
| Blob manquant après import | Recette / produit | Traiter comme sans photo (placeholder / picto) ; résumé import compte manquants |
| DLC ≤ 3 jours | Garde-manger | Badge warning + tri optionnel |
| Plan modifié | Liste courses | `regenerate-banner` si items auto |
| Mode Courses vide | Courses | Bouton Mode Courses désactivé ou message |
| Import échoué | Paramètres | Toast erreur · données locales intactes |
| Export échoué / mémoire | Paramètres | Toast « Export impossible » · pas de corruption |
| Mot de passe import incorrect | Paramètres | Message clair · aucune écriture partielle |
| Jour sans repas | Synthèse | Zéros silencieux |
| Rappel export FR-24 | Shell + Accueil | Bannière et/ou carte ; snooze/dismiss selon logique backup |

## Interaction Primitives

- **Tap** — Action primaire.
- **Long-press** — Menu contextuel cartes ; **équivalent clavier** : menu via ⋮ ou action secondaire focusable.
- **Swipe horizontal** — Jours synthèse macros (`prefers-reduced-motion` : tap jours à la place).
- **Pull-to-refresh** — Catalogue et garde-manger.
- **Bottom sheet** — Pickers, confirmations non destructives.
- **Dialog modal** — Destructif uniquement (archiver produit référencé, supprimer recette planifiée).
- **Picker système** — Galerie / caméra photo recette.

**Interdit en Mode Courses** : swipe-to-delete, animations de célébration, toasts non critiques, toute image.

## Accessibility Floor

- Contrastes : tableau complet `DESIGN.md` § Colors. `{colors.ink-disabled}` **jamais** pour du texte lisible.
- Tout contrôle ≥ 44×44 px ; Mode Courses lignes ≥ 52 px ; hit target = carte / créneau / ligne, pas la vignette seule.
- **Priorité** : pastille + label visible « Haute » / « Moyenne » / « Basse » (WCAG 1.4.1).
- **Macros** : `aria` annonce valeur, objectif **et** état textuel (sous / atteint / dépassement).
- **Mode Courses** : `aria-checked` sur la ligne ; barré + opacité = encodage non-couleur ; corps coché en `{colors.ink-primary}`.
- **Focus visible** sur tous les contrôles, toutes surfaces.
- `prefers-reduced-motion` : pas de transition &gt; 100 ms ; sheets sans slide ; swipe jours désactivé.
- **Scanner** : saisie manuelle toujours visible ; hint hors overlay contrasté.
- **Photos recettes** : `alt` = titre (titre obligatoire non blanc). Bandeaux, placeholders, vignettes OFF, `plan-slot-thumb` : `aria-hidden` si le nom visible suffit.
- **Score / rating** : `aria-label` « Score nutritionnel n » ; variante « Lavash, 4 sur 5 ».
- **Toasts** : `aria-live="polite"` pour succès et erreurs photo/export.
- **`photo-prompt`** : focus initial Galerie ; ordre tab adapté si Caméra absente.

## Responsive & Platform

| Plateforme | Comportement |
|------------|-------------|
| Android Chrome PWA | Expérience complète · scan caméra · install prompt |
| iOS Safari | PWA · **pas de scan barcode** → saisie directe. Photo : picker système ; permissions refusées → galerie ou Plus tard |
| Desktop (dev) | Layout mobile centré max 428 px · bottom nav conservée |

## Inspiration & Anti-patterns

- **Inspiré de** : listes courses papier · Excel catalogue 2 niveaux · mode magasin plein écran.
- **Rejeté — MyFitnessPal, Duolingo/streaks, comparateur grille, animations magasin, magazine food, photos en rayon, E9.2 tel quel** (levé pour recettes user + OFF caché).

## Key Flows

### Flow 1 — Ronan planifie sa semaine le dimanche soir (UJ-1)

1. Ronan ouvre l'onglet **Plan** dimanche soir.
2. Vue semaine + bandeau table ; il tape « Lundi · Déjeuner ».
3. Picker recette → « Wrap poulet ».
4. Créneau : pastille + « Wrap poulet · Par défaut ».
5. Chip variante → « Lavash » pour lundi déjeuner.
6. Il répète pour 5–7 jours.
7. Synthèse lundi — barres vs objectifs.
8. Onglet **Courses** → « Générer depuis le plan ».
9. **Climax** : liste = ingrédients manquants (plan − garde-manger), agrégés par produit.

Échec : garde-manger vide → liste = total ingrédients du plan.

### Flow 2 — Ronan scanne un yaourt en rayon (UJ-2)

1. **Produits** en magasin → **FAB Scan**.
2. Scanner (Android caméra / iOS saisie).
3. Lookup OFF → preview macros + vignette si image OFF.
4. Rattacher ou créer produit générique.
5. Référence créée, proposée préférée.
6. **Climax** : catalogue enrichi en quelques secondes.

Échec : inconnu OFF → formulaire manuel. iOS → saisie directe.

### Flow 3 — Ronan fait ses courses (Mode Courses)

1. **Courses** → « Mode Courses ».
2. Plein écran, compteur restants, zéro image.
3. Tap chaque ligne — coche instantanée, barré.
4. **Climax** : « 0 restant » → « Terminer ».

Échec : liste vide → Mode Courses indisponible. Offline : OK.

### Flow 4 — Ronan change de variante le jour J (cook)

1. **Plan** → créneau « Déjeuner ».
2. « Wrap poulet · Lavash ».
3. Chip variante → « Double protéine ».
4. **Climax** : synthèse mardi mise à jour (+protéines).

Échec : recette archivée entre-temps → message + picker autre recette.

### Flow 5 — Navigation shell (transversal)

1. Ronan est sur **Garde-manger**.
2. Tap titre header → **Accueil** (1 tap).
3. Tap onglet **Produits** → instantané.
4. Engrenage → **Paramètres** ; retour → **Produits** conservé.

**Climax** : depuis Accueil, toute surface onglet en 1 tap ; Paramètres en 1 tap depuis n'importe quel écran shell.

Échec : `hideHomeOnStartup` → cold start Garde-manger au lieu d'Accueil (comportement attendu).

### Flow 6 — Ronan ajoute une photo à une recette

1. Crée « Wrap poulet », enregistre (titre non vide).
2. **`photo-prompt`** — recette déjà sauvée.
3. **Galerie** → assiette choisie.
4. Liste : bandeau + vignette. Détail : hero. Plan : pastille.
5. **Climax** : le plan devient visuel ; Mode Courses reste sans image.

Échec — Plus tard : placeholder. Caméra refusée : Galerie. Galerie refusée : Plus tard. Quota ajout : placeholder + message. Quota remplacement : ancienne photo gardée. Retour système / picker annulé : reste sur prompt ou Plus tard si sortie définitive.

### Flow 7 — Ronan sauvegarde avant changement de téléphone (UJ-3)

1. Ronan ouvre **Paramètres** (engrenage ou carte Accueil « Sauvegarde » si rappel FR-24).
2. **Exporter** → choisit JSON clair ou chiffré (mot de passe) → avertissement si fichier volumineux (photos incluses).
3. Fichier `.nutrition-backup` ou `.nutrition-backup.enc` partagé / sauvegardé.
4. Sur le nouveau téléphone : **Importer** → fichier + mot de passe si chiffré.
5. Résumé : « Import terminé — X photos restaurées, Y manquantes » si blobs absents.
6. **Climax** : Garde-manger, Recettes, Plan, Objectifs identiques ; photos présentes ou placeholder si blob manquant.

Échec — mot de passe incorrect : message clair, données locales intactes. Fichier invalide : aucune écriture partielle. Export interrompu : toast erreur, pas de corruption.

### Flow 8 — Ronan termine l'onboarding (première recette)

1. Première ouverture → `/onboarding` (zéro recette).
2. Étape 1 : macros optionnels → Passer ou Enregistrer.
3. Étape 2 : import pack Ciqual ou visite bibliothèque.
4. Étape 3 : omelette guidée **ou** recette custom.
5. Recette créée → **`photo-prompt`** (même règles que Flow 6).
6. **Climax** : `/home` avec cartes texte ; `onboardingCompleted = true` ; prochain cold start → Accueil (sauf masquage).

Échec — pack ingrédients manquant : message + lien bibliothèque. Custom abandonné : retour étape 3.

## Product-Specific Sections

### Catalogue 2 niveaux — règles d'affichage

- Liste = **Products** uniquement.
- Détail = en-tête générique + références triées score ↓.
- Enseigne affichée = `preferredReferenceId` active.

### Variantes recette — règles d'affichage

- Une photo par `Recipe` (famille), pas par `RecipeVariant`.
- Rating sur variante en texte « n/5 ».

### Visuels persistants

- **Maison** : bandeaux Garde-manger / Recettes / Plan ; photos recettes ; vignettes OFF catalogue + preview scan.
- **Magasin nu** : Accueil, onboarding, Mode Courses, liste Courses, Objectifs, Paramètres.
- Import image : resize + WebP, pas d'écran crop (`cover` centré).

### Backup, blobs et import (FR-22–24, UJ-3, AD-10)

- **Export** : blobs (photos recettes + vignettes OFF) **toujours** inclus, clair ou chiffré. Pas d'opt-out. Avertissement taille si seuil dépassé ; progression si chiffrement long.
- **Import replace-all** : fichier = source de vérité ; blob absent pour une entité → fallback visuel (placeholder / picto), pas d'`<img>` cassée.
- **Import merge** : recette même `id` — photo import gagne si blob présent, sinon conserver photo locale. Produit / ref — vignette OFF suit la ref fusionnée ; blob orphelin ignoré. Résumé post-import compte visuels restaurés vs manquants.
- **FR-24** : rappel 30 jours = `backup-reminder-banner` shell et/ou carte Accueil ; snooze/dismiss ; pas un `surface-banner`.

### Régénération liste courses

- `regenerate-banner` texte si plan modifié et items `auto` existants.
- « Régénérer » : supprime `auto`, préserve `manual`.
- Manual + auto même produit = 2 lignes.
