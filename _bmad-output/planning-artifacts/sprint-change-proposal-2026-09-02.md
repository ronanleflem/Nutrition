---
title: Sprint Change Proposal — Epic 13 Visuels persistants
created: 2026-09-02
status: approved
trigger: UX contract PR #25 — Validate + Update spines (maison visuelle / magasin nu)
scope: moderate
handoff: bmad-build (Developer)
---

# Sprint Change Proposal — Nutrition

## 1. Issue Summary

**Problème** — Après Epic 9 (palette forêt, pictos catégories, empty states), l’application reste visuellement sobre : pas de photos recettes, pas de vignettes OFF, pas de bandeaux de surface. Le contrat UX « visuels persistants » a été finalisé dans les spines (`DESIGN.md` / `EXPERIENCE.md`), validé multi-lentilles, puis mis à jour — mais **aucun epic ni FR post-MVP** ne couvrait l’implémentation.

**Contexte** — Découverte lors du coaching UX Update (PR 25). Epic 12 (Accueil / onboarding) est livré ; le spine commit désormais `photo-prompt` après la première recette onboarding et classe Accueil/onboarding en **magasin nu** (texte seul).

**Evidence** — Validation : 4 critical / 18 high avant Update ; spines maintenant extractibles. Gap code : pas de `photo-prompt`, pas de blobs images, pas de `surface-banner`, onboarding saute le prompt photo.

## 2. Impact Analysis

### Epics

| Epic | Impact |
|------|--------|
| **E9** | Story 9.2 (« pas de photos réalistes ») **supersédée** pour recettes + OFF — pictos catégories restent ; photos autorisées ailleurs. Pas de rollback E9. |
| **E12** | Onboarding doit enchaîner sur `photo-prompt` (gap vs code actuel) — couvert par story 13.2. |
| **E8** | Export/import doit inclure blobs et règles restore/merge — story 13.6. |
| **E13 (nouveau)** | Implémente le contrat UX visuels persistants. |

### Artifacts

| Artefact | Action |
|----------|--------|
| `DESIGN.md` / `EXPERIENCE.md` | ✅ À jour (PR 25) — source de vérité implémentation |
| `epics-post-mvp.md` | ➕ Epic 13 + FR-39…FR-45 |
| `sprint-status.yaml` | ➕ epic-13 backlog |
| `epic-13-context.md` | ➕ nouveau |
| Architecture / data-model | ➕ blobs images (à préciser en 13.1) |
| PRD addendum | Note supersession E9.2 + renvoi FR post-MVP |

### Technique

- Nouvelle persistance blobs IndexedDB (recettes + vignettes OFF).
- Pipeline resize WebP côté client.
- Composants : `photo-prompt`, `surface-banner`, `recipe-photo-placeholder`, thumbs liste/détail/plan.
- Extension backup export/import.
- Pass accessibilité : labels priorité visibles, `aria-checked` Mode Courses, contrastes `DESIGN.md`.

**Pas de backend.** Local-first inchangé.

## 3. Recommended Approach

**Option retenue : Direct Adjustment** — Nouvel Epic 13 post-E12, sans rollback.

| Critère | Évaluation |
|---------|------------|
| Effort | Moyen — 6 stories, dépendances E8/E9/E12 existantes |
| Risque | Moyen — taille export, quotas stockage navigateur |
| MVP | Inchangé — extension post-MVP |
| Priorité | Après E12 (fait) ; avant ou en parallèle finition E4–E8 en review |

**Ordre epics post-MVP** : E10 → E11 → E9 → E12 → **E13**

## 4. Detailed Change Proposals

### FR post-MVP ajoutés (`epics-post-mvp.md`)

| FR | Intitulé |
|----|----------|
| FR-39 | Photos utilisateur sur recettes (vignette liste, hero détail, pastille plan) + placeholder plat partagé |
| FR-40 | Prompt photo post-création (Galerie / Caméra / Plus tard), y compris première recette onboarding |
| FR-41 | Vignettes OFF sur catalogue et preview scan (copie locale à l'import) |
| FR-42 | Bandeaux illustrés sur Garde-manger, Recettes et Plan (~100 px, une scène par surface) |
| FR-43 | Blobs images toujours dans l'export ; restore/merge avec fallback visuel |
| FR-44 | Contrat magasin nu : zéro image sur Accueil, onboarding, Mode Courses, liste Courses, Objectifs, Paramètres |
| FR-45 | Accessibilité couche visuelle (labels priorité visibles, contrastes, aria-checked courses, hit targets) |

### Epic 13 — Stories

Voir `epics-post-mvp.md` § Epic 13 et `implementation-artifacts/epic-13-context.md`.

## 5. Implementation Handoff

**Scope : Moderate** — Backlog mis à jour ; implémentation par stories via `bmad-build`.

**Handoff** : Developer (`bmad-build`) — ordre suggéré 13.1 → 13.2 → 13.3 → 13.4 → 13.5 → 13.6.

**Critères de succès** :
- Flow 6 et Flow 8 UX passent manuellement.
- Mode Courses et Accueil sans aucune image.
- Export avec photos → import sur autre session → visuels restaurés ou placeholder.
- Validation a11y : plus de critical sur contrastes / priorité couleur seule.

**Approval** : Utilisateur « Yes go » — 2026-09-02.
