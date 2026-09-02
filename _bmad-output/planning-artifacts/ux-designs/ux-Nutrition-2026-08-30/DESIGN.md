---
name: Nutrition
description: PWA nutrition personnelle mobile-first. Thème sombre forêt, maison visuelle (photos + bandeaux), magasin nu — lisibilité OLED, accents mousse, densité sans bruit en Mode Courses.
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
colors:
  surface-base: '#1A1F1A'
  surface-raised: '#242B24'
  surface-overlay: '#2F372F'
  surface-inset: '#121612'
  ink-primary: '#F5F5F5'
  ink-secondary: '#B8C4B8'
  ink-warm: '#E8E0D4'
  ink-disabled: '#6B756B'
  accent-positive: '#8FBC8F'
  accent-positive-muted: '#5A7A58'
  accent-warning: '#C4A77D'
  accent-danger: '#D98A7A'
  accent-info: '#7EB0C9'
  border-subtle: '#3A443A'
  border-strong: '#505A50'
  priority-green: '#4CAF50'
  priority-yellow: '#FFC107'
  priority-gray: '#9E9E9E'
  macro-under: '#7EB0C9'
  macro-met: '#8FBC8F'
  macro-over: '#C4A77D'
  scan-overlay: 'rgba(0,0,0,0.65)'
typography:
  display:
    fontFamily: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
  title:
    fontFamily: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  meta:
    fontFamily: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  numeric:
    fontFamily: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
    fontSize: 15px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: '0.02em'
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  bottom-nav-height: 56px
  touch-min: 44px
  screen-gutter: 16px
components:
  bottom-nav:
    height: '{spacing.bottom-nav-height}'
    background: '{colors.surface-raised}'
    borderTop: '1px solid {colors.border-subtle}'
    iconSize: 24px
    labelSize: '{typography.meta.fontSize}'
  fab-scan:
    size: 56px
    background: '{colors.accent-positive}'
    iconColor: '{colors.surface-base}'
    shadow: '0 4px 12px rgba(0,0,0,0.4)'
  product-card:
    background: '{colors.surface-raised}'
    borderRadius: '{rounded.md}'
    padding: '{spacing.4}'
    border: '1px solid {colors.border-subtle}'
  priority-badge:
    green: '{colors.priority-green}'
    yellow: '{colors.priority-yellow}'
    gray: '{colors.priority-gray}'
    size: 10px
  macro-bar:
    height: 8px
    track: '{colors.surface-overlay}'
    radius: '{rounded.full}'
  shopping-row:
    minHeight: '{spacing.touch-min}'
    checkedOpacity: 0.55
    strikethrough: true
  score-chip:
    background: '{colors.surface-overlay}'
    color: '{colors.ink-secondary}'
    fontSize: '{typography.meta.fontSize}'
    padding: '2px 8px'
    borderRadius: '{rounded.full}'
  recipe-thumb:
    size: 72px
    radius: '{rounded.md}'
    objectFit: cover
  product-thumb:
    size: 72px
    radius: '{rounded.sm}'
    objectFit: cover
  plan-slot-thumb:
    size: 40px
    radius: '{rounded.sm}'
    objectFit: cover
  recipe-hero:
    height: 180px
    objectFit: cover
  surface-banner:
    height: 100px
  recipe-placeholder:
    fill: '{colors.surface-overlay}'
    stroke: '{colors.ink-warm}'
  shell-header:
    height: 56px
    titleLink: '{colors.ink-primary}'
    settingsIconSize: 24px
  home-card:
    background: '{colors.surface-raised}'
    borderRadius: '{rounded.md}'
    padding: '{spacing.4}'
    border: '1px solid {colors.border-subtle}'
  backup-reminder-banner:
    background: '{colors.surface-overlay}'
    borderBottom: '1px solid {colors.border-subtle}'
    textColor: '{colors.ink-secondary}'
---

## Brand & Style

Nutrition est un **assistant courses-cuisine-planification** pour un usage solo en France — pas un journal calorique gamifié, pas une app lifestyle food. L'esthétique suit cette posture : **fonctionnel, calme, sombre par défaut**, pensée pour le magasin (OLED, contraste élevé) et le dimanche soir (planification rapide).

Le thème sombre adopte une palette **forêt** : fond teinté vert profond, accents mousse (`{colors.accent-positive}`) pour les actions constructives, terre cuite (`{colors.accent-warning}`) pour les alertes douces, crème (`{colors.ink-warm}`) pour titres et empty states. Les indicateurs nutritionnels (priorité 🟢🟡, macros atteint/dépassé) utilisent une palette sémantique distincte des actions UI.

**Visuels persistants (maison / magasin).** À la maison, le thème a une présence réelle même listes remplies : bandeau illustré `{components.surface-banner}` sur Garde-manger, Recettes et Plan ; photos utilisateur sur les recettes ; vignettes OFF contraintes sur le catalogue. En magasin (Mode Courses, Objectifs, Paramètres, liste Courses normale) : **aucune photo, aucun bandeau**. Les empty states E9 (pictos ligne) restent pour les listes vides ; ils ne remplacent pas les bandeaux.

Les illustrations (bandeaux, placeholder recette) partagent **une seule main** : trait simple, teintes forêt, pas de réalisme, pas trois styles. Une scène par surface (étagères / plat-planche / semaine-table), pas un motif unique répété.

Pas de streaks, pas de badges de gamification, pas d'animations distrayantes en Mode Courses. Les bandeaux sont **statiques**.

→ Références visuelles : voir liens inline dans § Components et la table des mocks dans `EXPERIENCE.md` § Information Architecture. **Les spines gagnent en cas de conflit avec un mock** (mocks `shell-nav.html`, `shopping-mode.html`, `macro-synthesis.html` encore sur palette E1 — ne pas les copier pour les tokens).

## Colors

- **Surface Base (`{colors.surface-base}`)** — Fond principal. Canvas OLED profond teinté vert forêt (`#1A1F1A`).
- **Surface Raised (`{colors.surface-raised}`)** — Cartes produit, panneaux, bottom nav. Légèrement plus clair pour hiérarchie tonale.
- **Surface Overlay (`{colors.surface-overlay}`)** — Modales, bottom sheets, champs de formulaire, bannière rappel export.
- **Surface Inset (`{colors.surface-inset}`)** — Champs enfoncés, zones de saisie sur fond overlay.
- **Ink Primary (`{colors.ink-primary}`)** — Texte principal, titres cartes Accueil.
- **Ink Secondary (`{colors.ink-secondary}`)** — Métadonnées, labels, sous-titres enseigne/marque, copy secondaire empty states, placeholders de champs.
- **Ink Warm (`{colors.ink-warm}`)** — Titres d'empty states et accents chaleureux. Crème `#E8E0D4`.
- **Ink Disabled (`{colors.ink-disabled}`)** — **Décoratif uniquement** (pictos empty state, traits placeholder). **Jamais** encre de corps, CTA, placeholder de champ ou créneau vide — utiliser `{colors.ink-secondary}` à la place.
- **Accent Positive (`{colors.accent-positive}`)** — FAB scan, boutons primaires, onglet actif, macro « atteint ». Vert mousse `#8FBC8F`.
- **Accent Warning (`{colors.accent-warning}`)** — DLC proche, macro dépassé, alertes non bloquantes. Terre cuite `#C4A77D`.
- **Accent Danger (`{colors.accent-danger}`)** — Erreurs, confirmations destructives. Utilisé avec parcimonie.
- **Accent Info (`{colors.accent-info}`)** — Liens informatifs, focus ring optionnel.
- **Border Subtle / Strong** — `{colors.border-subtle}` séparateurs cartes ; `{colors.border-strong}` focus actif, séparateurs emphase.
- **Priority tokens** — `{colors.priority-green}` / `{colors.priority-yellow}` / `{colors.priority-gray}` mappent les priorités catalogue Excel (🟢🟡). **Toujours** accompagnés d'un label texte visible (voir `{components.priority-badge}`).
- **Macro tokens** — `{colors.macro-under}` / `{colors.macro-met}` / `{colors.macro-over}` pour barres de synthèse journalière. L'état est **aussi** annoncé en texte (voir `EXPERIENCE.md` § Accessibility Floor).
- **Scan overlay (`{colors.scan-overlay}`)** — Exception alpha autorisée (`rgba`). Hint et bouton saisie **hors** overlay, en `{colors.ink-primary}` sur fond sombre.

### Contrastes porteurs (WCAG 2.x AA)

| Paire | Usage | Cible | Ratio estimé |
|-------|-------|-------|--------------|
| `{colors.ink-primary}` / `{colors.surface-base}` | Corps, titres | texte ≥ 4.5:1 | ~15.3:1 |
| `{colors.ink-secondary}` / `{colors.surface-base}` | Meta, empty copy | texte ≥ 4.5:1 | ~9.3:1 |
| `{colors.ink-warm}` / `{colors.surface-base}` | Titres empty | texte ≥ 4.5:1 | ~12.8:1 |
| `{colors.accent-positive}` / `{colors.surface-base}` | CTA texte, onglet actif | texte ≥ 4.5:1 | ~7.8:1 |
| `{colors.surface-base}` / `{colors.accent-positive}` | Icône FAB | UI ≥ 3:1 | ~7.8:1 |
| `{colors.ink-secondary}` / `{colors.surface-raised}` | Meta sur carte | texte ≥ 4.5:1 | ~8.5:1 |
| `{colors.ink-primary}` à `{components.shopping-row.checkedOpacity}` / `{colors.surface-base}` | Ligne cochée | texte ≥ 4.5:1 après fade | ≥ 5.5:1 |
| `{colors.ink-secondary}` à 0.55 / `{colors.surface-base}` | Meta ligne cochée | texte ≥ 4.5:1 | **interdit** — corps coché en `{colors.ink-primary}` |
| Badge « manuel » `{colors.ink-secondary}` / `{colors.surface-overlay}` | Liste courses | texte ≥ 4.5:1 | vérifier ≥ 4.5:1 |
| Hint scanner / bouton saisie | Hors overlay | texte ≥ 4.5:1 | `{colors.ink-primary}` |

Éviter : dégradés décoratifs, fonds colorés derrière du texte long, rouge agressif pour des états non critiques, `{colors.ink-disabled}` comme texte lisible.

## Typography

System font stack exclusivement (perf PWA, pas de webfont). Quatre rôles :

- **Display** — Titres de section, en-têtes Mode Courses.
- **Title** — Noms de produits, titres de recettes.
- **Body** — Contenu, étapes, listes.
- **Meta** — Enseignes, dates DLC, labels de champs.
- **Numeric** — Macros (kcal, P/L/G), quantités grammes, scores. Tabular nums via `font-variant-numeric: tabular-nums`.

Pas de tailles display > 24px. Pas de tout-caps sauf labels FAB courts (« SCAN »).

## Layout & Spacing

Échelle `{spacing.1}`–`{spacing.7}`. Gouttière écran `{spacing.screen-gutter}` (16px). Single-column mobile toujours.

- **Shell header** — `{components.shell-header}` : titre d'écran à gauche (lien vers `/home` sauf sur Accueil) · engrenage Paramètres à droite (tous les écrans shell, y compris Accueil). Zone tactile engrenage ≥ `{spacing.touch-min}`.
- **Bottom nav** — Hauteur fixe `{spacing.bottom-nav-height}`, 5 onglets (pas de 6ᵉ onglet Accueil). Masquée en onboarding et Mode Courses.
- **Touch minimum** — `{spacing.touch-min}` (44px) sur tout contrôle interactif ; Mode Courses : 52px minimum sur les lignes cochables.
- **Listes denses** — Padding vertical `{spacing.3}` entre lignes catalogue ; `{spacing.4}` entre cartes. Vignettes `{components.recipe-thumb}` / `{components.product-thumb}` à gauche, texte à droite — pas de photo pleine largeur en liste.
- **Bandeau de surface** — `{components.surface-banner.height}` sous le header shell (ou sous la bannière rappel export si visible), au-dessus de la liste, uniquement sur Garde-manger / Recettes / Plan. **Pas** sur Accueil, onboarding, sous-écrans, Objectifs, Paramètres, Mode Courses, liste Courses.
- **Bannière rappel export (FR-24)** — `{components.backup-reminder-banner}` : bandeau texte shell sous le header, **pas** un `surface-banner` illustré. Visible sur toutes les surfaces shell sauf onboarding et Mode Courses. Carte « Sauvegarde » sur Accueil = rappel équivalent, pas de doublon si les deux affichés.
- **Modales** — Bottom sheet sur mobile (slide-up) ; max 90vh ; poignée de drag optionnelle. Prompt photo post-création = écran court plein cadre, pas une modale centrée.

## Elevation & Depth

Hiérarchie par **tonalité**, pas par ombre. Ombres réservées au FAB scan (`{components.fab-scan.shadow}`) et bottom sheets. Cartes sur `{colors.surface-raised}` sans drop-shadow.

## Shapes

- `{rounded.sm}` — Chips, badges score, inputs.
- `{rounded.md}` — Cartes produit, panneaux, boutons, vignette recette.
- `{rounded.lg}` — Bottom sheets, modales.
- `{rounded.full}` — FAB, pastilles priorité, barres macro.
- Images : coins = ceux du conteneur ; `object-fit: cover` centré ; jamais de titre en overlay sur une photo de liste.

## Components

> Clé canonique = kebab-case frontmatter / première colonne `EXPERIENCE.md` Component Patterns. Les titres prose reprennent la même clé.

### `bottom-nav` (`{components.bottom-nav}`)

5 destinations : Garde-manger, Produits, Recettes, Plan, Courses. Icône + label `{typography.meta}`. Onglet actif : `{colors.accent-positive}` + label bold. Inactif : `{colors.ink-secondary}`. Masqué en onboarding et Mode Courses.

→ `mockups/shell-nav.html` (composition shell ; palette E1 obsolète — lire les tokens forêt).

### `fab-scan` (`{components.fab-scan}`)

Flottant bas-droite sur l'écran Produits uniquement. Icône code-barres `{colors.surface-base}` sur `{colors.accent-positive}`. Ouvre le scanner plein écran. Masqué en Mode Courses.

### `shell-header` (`{components.shell-header}`)

Titre d'écran ; hors `/home`, le titre est un lien vers Accueil. Engrenage Paramètres à droite, `aria-label="Paramètres"`, zone ≥ `{spacing.touch-min}`.

### `home-card` (`{components.home-card}`)

Carte texte Accueil : titre `{typography.title}`, corps `{typography.body}` ou `{typography.meta}`, CTA discret. **Aucune** vignette, bandeau ni photo. Tap carte entière ≥ `{spacing.touch-min}` hauteur effective.

### `backup-reminder-banner` (`{components.backup-reminder-banner}`)

Bandeau texte FR-24 sous le header shell. Copy `{typography.meta}` en `{colors.ink-secondary}`. Lien « Exporter » en `{colors.accent-positive}`. Pas d'illustration.

### `product-card` (`{components.product-card}`)

Structure : `{components.priority-badge}` · **vignette** `{components.product-thumb}` (photo OFF de la ref préférée active, sinon picto catégorie) · nom générique (`{typography.title}`) · `{components.score-chip}` · enseigne principale (`{typography.meta}`) · macros résumé 1 ligne (`{typography.numeric}`). Tap → détail produit.

→ `mockups/products-catalog.html`

### `recipe-card`

Liste Recettes : vignette `{components.recipe-thumb}` à gauche · titre (`{typography.title}`) + variante défaut (`{typography.meta}`) à droite. Photo utilisateur si présente ; sinon `{components.recipe-placeholder}`. Hit target = carte entière ≥ `{spacing.touch-min}` ; la vignette 72 px est visuelle, pas la zone tactile isolée.

→ `mockups/recipes-list.html`

### `recipe-hero`

Détail recette : image `{components.recipe-hero.height}`, `cover` centré, sous le header. Sans photo : la même illustration plat, agrandie. Pas de bandeau de surface sur le détail.

### `surface-banner` (`{components.surface-banner}`)

Bandeau `{components.surface-banner.height}` en tête de Garde-manger, Recettes et Plan (listes remplies **et** vides). Scènes distinctes, une main : bocaux/étagères · plat/planche · semaine/table. `aria-hidden`. Ne remplace pas le titre d'écran.

### `plan-slot-thumb` (`{components.plan-slot-thumb}`)

Créneau rempli : pastille `{components.plan-slot-thumb}` à gauche du nom (photo ou placeholder plat, `aria-hidden` — le nom de recette suffit). Créneau vide : pas d'image, label « + » en `{colors.ink-secondary}` (pas `{colors.ink-disabled}`). Hit target = créneau entier ≥ `{spacing.touch-min}`.

→ `mockups/meal-plan.html`

### `photo-prompt`

Écran court après enregistrement d'une recette (y compris première recette onboarding). Titre `{typography.title}` crème : « Ajouter une photo ? » + sous-titre nom recette. Trois actions pleine largeur ≥ `{spacing.touch-min}` : Galerie (primaire mousse), Caméra, Plus tard (`{colors.ink-secondary}`). Focus initial sur Galerie ; ordre tab Galerie → Caméra → Plus tard ; si Caméra masquée (permission), hors tab order.

→ `mockups/photo-prompt.html`

### `food-category-label`

Picto ligne monochrome teinté `{colors.accent-positive-muted}` (décoratif `aria-hidden`) + **label texte** catégorie visible. Jamais seul comme substitut d'une photo recette.

### `reference-row`

Sous le produit générique : label référence, enseigne, macros/100g, score. Badge « Préférée » si `preferredReferenceId`. Swipe ou menu ⋮ pour archiver.

### `priority-badge` (`{components.priority-badge}`)

Pastille 10px ronde + **label texte visible** `{typography.meta}` : « Haute » / « Moyenne » / « Basse » (ou initiales H/M/B si espace contraint). Couleur selon `priority` enum. `aria-label` en complément, pas en remplacement du label visible (WCAG 1.4.1).

### `macro-bar` (`{components.macro-bar}`)

Track `{colors.surface-overlay}`, fill selon état macro (`under`/`met`/`over`). Hauteur 8px. Label au-dessus : « Protéines 142 / 150 g » + mot d'état (« Sous objectif » / « Atteint » / « Dépassement »).

→ `mockups/macro-synthesis.html` (palette E1 obsolète pour les tokens).

### `variant-chip-row`

Chips horizontales scrollables, hauteur tactile ≥ `{spacing.touch-min}`. Sélectionnée : bordure `{colors.accent-positive}`. Nom variante + rating texte « 4/5 » (pas étoiles seules).

### `shopping-row` (`{components.shopping-row}`)

Ligne entière toggle checked (`aria-checked` sur la ligne ou checkbox). Zone gauche 52px. Nom en `{colors.ink-primary}` ; coché : opacité `{components.shopping-row.checkedOpacity}` + barré (encodage non-couleur). Quantité `{typography.numeric}` à droite. Badge « manuel » discret si `source: manual`, contraste texte ≥ 4.5:1.

→ `mockups/shopping-mode.html` (palette E1 obsolète ; vérifier `aria-checked`).

### `score-chip` (`{components.score-chip}`)

Score nutritionnel arrondi (ex. « 78 »). `aria-label` « Score nutritionnel 78 ». Couleur neutre.

### `empty-state`

Picto outline monochrome `{colors.ink-disabled}` (**décoratif**), titre `{typography.title}` en `{colors.ink-warm}` ou `{colors.ink-primary}`, description `{typography.body}` en `{colors.ink-secondary}` + CTA `{colors.accent-positive}`.

### `scanner-overlay`

Fond `{colors.scan-overlay}`, cadre de visée blanc. Hint « Placez le code-barres dans le cadre » et bouton « Saisir le code » **sous** l'overlay, `{colors.ink-primary}`. Auto-start caméra **Android uniquement** ; iOS = écran saisie code direct.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Thème sombre par défaut, contraste élevé en magasin | Thème clair au MVP |
| Accents sauge sur actions positives uniquement | Coloriser tout le UI en vert |
| Pastilles priorité + label texte **visible** (Haute/Moyenne/Basse) | Pastille couleur seule ou aria-label seul |
| Bottom nav + FAB scan contextuel | Drawer hamburger |
| Bottom sheets pour choix variante / filtres | Modales centrées petites difficiles au pouce |
| Animations ≤ 200ms hors Mode Courses | Animations, confettis, transitions longues en magasin |
| Grammes affichés avec unité « g » explicite | Unités implicites ou pièces |
| Français partout | Anglais dans l'UI |
| Photos recettes + vignettes OFF à la maison | Photos / bandeaux en Mode Courses, Objectifs, Paramètres, liste Courses |
| Vignette 72 px à gauche en liste | Cartes magazine, hero en liste, titre overlay sur photo |
| Bandeau ~100 px, une scène par surface, une main | Motif unique invisible, hero lifestyle, 3 styles d'illustration |
| Placeholder plat partagé si pas de photo | Carré vide, picto E9 seul, illustration unique par recette |
| `cover` centré, resize à l'import | JPEG appareil 4 Mo affiché tel quel, écran de crop |
