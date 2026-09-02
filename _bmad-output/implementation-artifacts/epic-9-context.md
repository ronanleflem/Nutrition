# Epic 9 Context: Identité visuelle sombre chaleureuse

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enrichir le thème sombre existant avec une identité « nature » (palette forêt : verts mousse, terre cuite, crème) pour rendre l'application plus accueillante au quotidien, tout en conservant la lisibilité en magasin (OLED, contrastes WCAG AA) et sans introduire de thème clair.

## Stories

- Story 9.1: Palette « forêt » sur fond sombre
- Story 9.2: Iconographie catégories alimentaires
- Story 9.3: Empty states et micro-copy chaleureuxs

## Requirements & Constraints

- Thème sombre unique — pas de thème clair ni toggle (FR-30).
- Palette « nature » : fond sombre teinté vert, accents mousse/terre cuite/crème.
- Contrastes WCAG AA conservés après refonte (NFR-17).
- Mode Courses inchangé fonctionnellement — pas d'animations distrayantes (NFR-18).
- Hiérarchie par tonalité, pas par ombres décoratives ; accents sauge/mousse pour actions positives uniquement.

## Technical Decisions

- Tokens CSS centralisés dans `src/styles/_tokens.scss` sous `[data-theme='dark']`.
- `ThemeService` applique `data-theme` sur `document.documentElement` ; défaut `dark`.
- Variables sémantiques existantes (`--color-surface-*`, `--color-ink-*`, `--color-accent-positive`, macros) à réaligner — pas de refactor composant massif.
- `DESIGN.md` est la référence design ; doit refléter la palette forêt.

## UX & Interaction Patterns

- Fond OLED profond avec teinte verte subtile ; surfaces raised/overlay légèrement plus claires.
- Accents constructifs en vert mousse ; alertes en terre cuite ; crème pour titres et empty states.
- Barres macro `met` alignées sur accent-positive ; pas de dégradés décoratifs.

## Cross-Story Dependencies

- Story 9.2 et 9.3 s'appuient sur les tokens définis en 9.1.
- Aucune dépendance bloquante sur Epic 10/11 ; peut être parallélisé.
