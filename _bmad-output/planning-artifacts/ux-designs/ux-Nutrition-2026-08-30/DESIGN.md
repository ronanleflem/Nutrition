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
---

## Brand & Style

Nutrition est un **assistant courses-cuisine-planification** pour un usage solo en France — pas un journal calorique gamifié, pas une app lifestyle food. L'esthétique suit cette posture : **fonctionnel, calme, sombre par défaut**, pensée pour le magasin (OLED, contraste élevé) et le dimanche soir (planification rapide).

Le thème sombre adopte une palette **forêt** : fond teinté vert profond, accents mousse (`{colors.accent-positive}`) pour les actions constructives, terre cuite (`{colors.accent-warning}`) pour les alertes douces, crème (`{colors.ink-warm}`) pour titres et empty states. Les indicateurs nutritionnels (priorité 🟢🟡, macros atteint/dépassé) utilisent une palette sémantique distincte des actions UI.

**Visuels persistants (maison / magasin).** À la maison, le thème a une présence réelle même listes remplies : bandeau illustré `{components.surface-banner}` sur Garde-manger, Recettes et Plan ; photos utilisateur sur les recettes ; vignettes OFF contraintes sur le catalogue. En magasin (Mode Courses, Objectifs, Paramètres, liste Courses normale) : **aucune photo, aucun bandeau**. Les empty states E9 (pictos ligne) restent pour les listes vides ; ils ne remplacent pas les bandeaux.

Les illustrations (bandeaux, placeholder recette) partagent **une seule main** : trait simple, teintes forêt, pas de réalisme, pas trois styles. Une scène par surface (étagères / plat-planche / semaine-table), pas un motif unique répété.

Pas de streaks, pas de badges de gamification, pas d'animations distrayantes en Mode Courses. Les bandeaux sont **statiques**.

→ Référence : `mockups/recipes-list.html`, `mockups/photo-prompt.html`. Les spines gagnent en cas de conflit avec un mock.

## Colors

- **Surface Base (`{colors.surface-base}`)** — Fond principal. Canvas OLED profond teinté vert forêt (`#1A1F1A`).
- **Surface Raised (`{colors.surface-raised}`)** — Cartes produit, panneaux, bottom nav. Légèrement plus clair pour hiérarchie tonale.
- **Surface Overlay (`{colors.surface-overlay}`)** — Modales, bottom sheets, champs de formulaire.
- **Ink Primary (`{colors.ink-primary}`)** — Texte principal. Ratio ≥ 4.5:1 sur `{colors.surface-base}` (WCAG AA).
- **Ink Secondary (`{colors.ink-secondary}`)** — Métadonnées, labels, sous-titres enseigne/marque.
- **Ink Warm (`{colors.ink-warm}`)** — Titres d'empty states et accents chaleureux. Crème `#E8E0D4`.
- **Accent Positive (`{colors.accent-positive}`)** — FAB scan, boutons primaires, macro « atteint ». Vert mousse `#8FBC8F`.
- **Accent Warning (`{colors.accent-warning}`)** — DLC proche, macro dépassé, alertes non bloquantes. Terre cuite `#C4A77D`.
- **Accent Danger (`{colors.accent-danger}`)** — Erreurs, confirmations destructives. Utilisé avec parcimonie.
- **Priority tokens** — `{colors.priority-green}` / `{colors.priority-yellow}` / `{colors.priority-gray}` mappent les priorités catalogue Excel (🟢🟡).
- **Macro tokens** — `{colors.macro-under}` / `{colors.macro-met}` / `{colors.macro-over}` pour barres de synthèse journalière.

Éviter : dégradés décoratifs, fonds colorés derrière du texte long, rouge agressif pour des états non critiques.

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

- **Bottom nav** — Hauteur fixe `{spacing.bottom-nav-height}`, 5 onglets principaux + accès Paramètres via icône engrenage sur Garde-manger ou menu overflow.
- **Touch minimum** — `{spacing.touch-min}` (44px) sur tout contrôle interactif ; Mode Courses : 52px minimum sur les lignes cochables.
- **Listes denses** — Padding vertical `{spacing.3}` entre lignes catalogue ; `{spacing.4}` entre cartes. Vignettes `{components.recipe-thumb}` / `{components.product-thumb}` à gauche, texte à droite — pas de photo pleine largeur en liste.
- **Bandeau de surface** — `{components.surface-banner.height}` sous le header, au-dessus de la liste, uniquement sur Garde-manger / Recettes / Plan. Les sous-écrans (formulaires, détail produit, Objectifs, Paramètres, Mode Courses) n'en ont pas.
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

### Bottom navigation (`{components.bottom-nav}`)

5 destinations : Garde-manger, Produits, Recettes, Plan, Courses. Icône + label `{typography.meta}`. Onglet actif : `{colors.accent-positive}` + label bold. Inactif : `{colors.ink-secondary}`.

### FAB Scan (`{components.fab-scan}`)

Flottant bas-droite sur l'écran Produits. Icône code-barres blanche. Ouvre le scanner plein écran.

### Product card (`{components.product-card}`)

Structure : pastille priorité · **vignette** `{components.product-thumb}` (photo OFF de la ref préférée, sinon picto catégorie) · nom générique (`{typography.title}`) · score chip · enseigne principale (`{typography.meta}`) · macros résumé 1 ligne (`{typography.numeric}`). Tap → détail produit avec liste des références.

→ `mockups/products-catalog.html`

### Recipe card

Liste Recettes : vignette `{components.recipe-thumb}` à gauche · titre (`{typography.title}`) + variante défaut (`{typography.meta}`) à droite. Photo utilisateur si présente ; sinon `{components.recipe-placeholder}` (illustration plat partagée, trait `{colors.ink-warm}` sur `{colors.surface-overlay}` — un dessin pour toutes les recettes sans photo, clairement non photo). Pas de titre en overlay.

→ `mockups/recipes-list.html`

### Recipe hero

Détail recette : image `{components.recipe-hero.height}`, `cover` centré, sous le header. Sans photo : la même illustration plat, agrandie. Pas de bandeau de surface sur le détail.

### Surface banner (`{components.surface-banner}`)

Bandeau `{components.surface-banner.height}` en tête de Garde-manger, Recettes et Plan (listes remplies **et** vides). Scènes distinctes, une main : bocaux/étagères · plat/planche · semaine/table. `aria-hidden`. Ne remplace pas le titre d'écran.

### Plan slot thumb (`{components.plan-slot-thumb}`)

Créneau rempli : pastille `{components.plan-slot-thumb}` à gauche du nom de recette (photo ou placeholder plat). Créneau vide : pas d'image, placeholder « + ».

→ `mockups/meal-plan.html`

### Photo prompt

Écran court après enregistrement d'une recette. Titre `{typography.title}` crème : « Ajouter une photo ? ». Trois actions pleine largeur ≥ `{spacing.touch-min}` : Galerie (primaire mousse), Caméra, Plus tard (`{colors.ink-secondary}`). Pas d'aperçu obligatoire avant choix.

→ `mockups/photo-prompt.html`

### Food category icon

Picto ligne monochrome teinté `{colors.accent-positive-muted}`, accompagné du label texte catégorie. Jamais seul comme substitut d'une photo recette (le placeholder plat joue ce rôle).

### Reference row

Sous le produit générique : label référence, enseigne, macros/100g, score. Badge « Préférée » si `preferredReferenceId`. Swipe ou menu ⋮ pour archiver.

### Priority badge (`{components.priority-badge}`)

Pastille 10px ronde. Couleur selon `priority` enum. Toujours accompagnée d'un label accessible (pas couleur seule).

### Macro progress bar (`{components.macro-bar}`)

Track `{colors.surface-overlay}`, fill selon état macro (`under`/`met`/`over`). Hauteur 8px. Label au-dessus : « Protéines 142 / 150 g ».

### Variant picker chip row

Chips horizontales scrollables pour variantes de recette. Sélectionnée : bordure `{colors.accent-positive}`. Affiche nom variante + étoiles rating si présent.

### Shopping row (`{components.shopping-row}`)

Checkbox gauche (zone 52px), nom produit centre, quantité grammes droite (`{typography.numeric}`). Coché : opacité réduite + texte barré. Badge « manuel » discret si `source: manual`.

### Score chip (`{components.score-chip}`)

Score nutritionnel arrondi (ex. « 78 »). Couleur neutre ; pas de code couleur score au MVP (le tri suffit).

### Empty state

Icône outline monochrome `{colors.ink-disabled}`, titre `{typography.title}`, description `{typography.body}` + CTA `{colors.accent-positive}`.

### Scanner overlay

Fond `{colors.scan-overlay}`, cadre de visée blanc, hint « Placez le code-barres dans le cadre ». Bouton « Saisir le code » toujours visible en bas.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Thème sombre par défaut, contraste élevé en magasin | Thème clair au MVP |
| Accents sauge sur actions positives uniquement | Coloriser tout le UI en vert |
| Pastilles priorité + label texte accessible | Indicateurs couleur seuls |
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
