# Spine Pair Review — Nutrition

## Overall verdict

Les spines sont un contrat **extractible pour les cinq surfaces critiques d’origine** (catalogue 2 niveaux, plan + variantes, synthèse, Mode Courses, shell 5 onglets) et pour la couche visuels persistants. Elles **ne sont pas un contrat complet du produit actuel** : UJ-3 (backup) n’a aucun Key Flow, et les surfaces livrées Accueil `/home` + onboarding `/onboarding` (Epic 12) sont absentes de l’IA, des états et des parcours. Un consommateur architecture / story-dev qui source-extrait uniquement cette paire inventera le cold start, le rappel FR-24 et les noms de composants.

## 1. Flow coverage — thin

Sources lues : PRD §2.3 (UJ-1, UJ-2, UJ-3) et §4 (FR-1…FR-24) ; addendum (décisions + IA 7 routes + E12 nommé) ; SPEC CAP-1…CAP-8 ; spine architecture AD-1…AD-15 ; `project-context.md` (E12 Accueil / onboarding). Vérifié pour chaque UJ / parcours nommé : Key Flow, protagoniste Ronan, étapes numérotées, climax, chemin d’échec.

Couvert avec climax + échec : Flow 1 (UJ-1, échec garde-manger vide) ; Flow 2 (UJ-2, OFF inconnu / iOS) ; Flow 6 (photo recette, trois échecs). Couvert partiellement : Flow 3 (Mode Courses / FR-21, offline seulement) ; Flow 4 (AD-14 cook, pas d’échec) ; Flow 5 (shell, pas de beat climax).

### Findings

- **critical** UJ-3 « Ronan sauvegarde avant changement de téléphone » n’a aucun Key Flow. Paramètres n’apparaissent que comme tap engrenage (Flow 5). Ni export chiffré, ni import mot de passe, ni climax « données identiques », ni échec mot de passe / fichier corrompu. CAP-8 / FR-22–FR-24 / AD-10 restent sans parcours UX. (EXPERIENCE.md § Key Flows ; PRD §2.3 UJ-3). *Fix:* ajouter un Flow 7 Ronan nommé, étapes Paramètres → Exporter (clair / `.enc`) → nouvel appareil → Importer, climax restauration, échecs mot de passe et validation schéma ; traiter FR-24 (rappel 30 jours) dans le même flow ou un état dédié.
- **high** Accueil `/home` et onboarding `/onboarding` (Epic 12, FR-32 / FR-33 dans `epics-post-mvp.md`) existent dans l’app après merge (`app.routes.ts`, `features/home`, `features/onboarding`) et **ne sont cités nulle part** dans les spines. Pas de Key Flow « première recette », pas de dashboard. (EXPERIENCE.md § Information Architecture, § Key Flows). *Fix:* commettre les surfaces et un parcours Ronan (cold start incomplet → wizard 3 étapes → `/home`) **après décision produit** — ne pas inventer le contenu des cartes Accueil dans un update UX sans capture.
- **medium** Titre UJ-1 non verbatim : PRD « Ronan planifie sa semaine **le dimanche soir** » vs Flow 1 « Ronan planifie sa semaine (UJ-1) ». (EXPERIENCE.md Flow 1 ; PRD §2.3). *Fix:* recopier le libellé PRD mot pour mot.
- **medium** Flow 5 (Navigation shell) n’a ni beat **Climax:** ni chemin d’échec ; ce n’est pas un parcours extractible au même standard que Flows 1–2–6. (EXPERIENCE.md Flow 5). *Fix:* soit le rétrograder en règle IA, soit ajouter climax (ex. « toute surface en ≤ 2 taps ») et un échec (onglet perdu / deep link).
- **low** Flow 4 (variante jour J) sans échec (variante manquante, recette archivée). (EXPERIENCE.md Flow 4). *Fix:* un cas limite si la famille n’a plus qu’une variante.

## 2. Token completeness — adequate

Frontmatter DESIGN.md : 24 couleurs (dont `scan-overlay` en `rgba`), 5 rôles typo, 4 `rounded`, 10 `spacing`, 13 clés `components`. Toutes les références `{path.to.token}` du corps DESIGN.md et EXPERIENCE.md (`{colors.*}`, `{spacing.*}`, `{rounded.*}`, `{typography.*}`, `{components.*}`) **résolvent**. Thème clair explicitement hors MVP (addendum + AD-12) — paires light/dark non exigées. Hex présent sur tous les tokens chromatiques sauf l’overlay.

### Findings

- **high** Une seule cible de contraste est chiffrée : `{colors.ink-primary}` ≥ 4.5:1 sur `{colors.surface-base}` (DESIGN.md § Colors ; EXPERIENCE.md § Accessibility Floor). Combinaisons porteuses **sans ratio** : `{colors.ink-secondary}` et `{colors.ink-disabled}` sur base (empty states, meta) ; `{colors.accent-positive}` comme texte d’onglet actif / CTA ; icône FAB `{colors.surface-base}` sur `{colors.accent-positive}` ; pastilles `{colors.priority-yellow}` / `{colors.priority-green}` ; ligne Courses cochée à `checkedOpacity: 0.55`. Un consommateur ne peut pas implémenter l’AA sans recalculer. *Fix:* table de contrastes pour ces paires (et l’état 55 % d’opacité) dans DESIGN.md § Colors.
- **medium** `{colors.scan-overlay: 'rgba(0,0,0,0.65)'}` n’est pas un hex, alors que `design-md-spec.md` impose des hex. (DESIGN.md frontmatter `colors`). *Fix:* token hex + alpha séparé, ou note explicite « overlay = exception alpha ».
- **low** Tokens définis jamais référencés dans le corps : `{colors.surface-inset}`, `{colors.accent-info}`, `{colors.border-strong}`. (DESIGN.md frontmatter). *Fix:* les lier à un usage (champs inset, focus info, séparateurs) ou les retirer pour éviter un spectre fantôme.

## 3. Component coverage — thin

Inventaire DESIGN.md § Components (visuel) : Bottom navigation, FAB Scan, Product card, Recipe card, Recipe hero, Surface banner, Plan slot thumb, Photo prompt, Food category icon, Reference row, Priority badge, Macro progress bar, Variant picker chip row, Shopping row, Score chip, Empty state, Scanner overlay.

Inventaire EXPERIENCE.md § Component Patterns (comportement) : `ProductCard`, `ProductThumb`, `ReferenceRow`, `ScannerView`, `RecipeCard`, `RecipeHero`, `RecipePhotoPlaceholder`, `SurfaceBanner`, `PhotoPrompt`, `WeekGrid`, `PlanSlotThumb`, `VariantChipRow`, `MacroBarGroup`, `ShoppingRow`, `StoreModeHeader`, `RegenerateBanner`, `EmptyState`, `FoodCategoryLabel`, `BottomSheet`.

### Findings

- **high** Identifiants **non identiques** d’un fichier à l’autre — un extracteur ne peut pas joindre visuel ↔ comportement par nom : `Scanner overlay` vs `ScannerView` ; `recipe-placeholder` / Recipe placeholder vs `RecipePhotoPlaceholder` ; `Variant picker chip row` vs `VariantChipRow` ; `Macro progress bar` / `macro-bar` vs `MacroBarGroup` ; `Food category icon` vs `FoodCategoryLabel`. kebab frontmatter vs Pascal table. (DESIGN.md § Components ; EXPERIENCE.md § Component Patterns). *Fix:* une clé canonique par composant (kebab frontmatter = titre DESIGN = première colonne EXPERIENCE).
- **high** `bottom-nav` et `fab-scan` ont une spec visuelle (y compris tokens) mais **aucune ligne** dans Component Patterns (auto-start caméra, masquage Mode Courses, 5 destinations, overflow). (DESIGN.md `{components.bottom-nav}` / `{components.fab-scan}` ; EXPERIENCE.md table). *Fix:* deux lignes comportementales (règles déjà éparpillées dans l’IA / Flow 2).
- **medium** Côté EXPERIENCE seulement, sans rangée DESIGN.md.Components : `WeekGrid`, `StoreModeHeader`, `RegenerateBanner`, `BottomSheet`. `Score chip` et `Priority badge` : visuel seulement (le comportement accessibilité des pastilles est dans a11y, pas dans la table). *Fix:* dual spec ou héritage explicite « chrome shell, pas de delta visuel ».
- **medium** Composants **livrés et absents des deux spines** : cartes Accueil (`home-card` repas / courses / DLC / sauvegarde), chrome wizard onboarding, lien titre header → `/home`. *Fix:* les ajouter seulement après décision UX capturée — ne pas rétro-spécifier le code.

## 4. State coverage — adequate

Surfaces IA spines : `/pantry`, `/products` (+ scan), `/recipes` (+ prompt photo), `/plan` (+ synthèse), `/shopping` (+ Mode Courses), `/goals`, `/settings`. États attendus par surface : vide, cold-load, focus, erreur, offline, permission caméra. Table State Patterns : 14 lignes, solides sur scan / photo / OFF / régénération / import.

### Findings

- **high** Aucun état pour Accueil (chargement, erreur + réessayer, cartes vides, carte rappel export) ni pour onboarding (étape 1–3, skip macros, échec import pack, abandon recette custom, relance depuis Paramètres, masquage bottom nav). Ces états **tournent dans l’app** et ne sont pas commis. (EXPERIENCE.md § State Patterns vs `home-page.component.html`, `onboarding-page.component.html`). *Fix:* étendre IA + State Patterns après capture ; ne pas inventer les microcopies.
- **medium** « Liste vide » ne cite que Catalogue / Recettes / Plan — **pas Garde-manger ni Liste de Courses**. Objectifs : pas d’état première visite / tous les champs vides (seul le comportement barre « sans cible » existe). (EXPERIENCE.md State Patterns ; IA `/pantry` `/shopping` `/goals`). *Fix:* trois lignes empty + CTA.
- **medium** Aucune ligne **Focus** (champs, scanner, prompt photo, chips variante) alors que l’a11y impose un focus visible. (EXPERIENCE.md § State Patterns vs § Accessibility Floor). *Fix:* une ligne Focus globale (ring token ou native).
- **low** Recherche catalogue vide et « Produits archivés » vides non décrits. *Fix:* une ligne chacune si ces listes restent des surfaces.

## 5. Visual reference coverage — adequate

Fichiers inventoriés :

| Dossier | Fichiers |
|---------|----------|
| `mockups/` | `shell-nav.html`, `products-catalog.html`, `recipes-list.html`, `photo-prompt.html`, `meal-plan.html`, `macro-synthesis.html`, `shopping-mode.html` |
| `.working/` | `key-recipes-list.html`, `key-photo-prompt.html` (doublons des mocks promus) |
| `wireframes/` | *(absent)* |
| `imports/` | *(absent)* |

« Les spines gagnent en cas de conflit » : DESIGN.md § Brand & Style **et** EXPERIENCE.md chapeau — dit deux fois (une par spine), pas une seule fois pour la paire.

### Findings

- **medium** EXPERIENCE.md § IA liste les 7 mocks en **une ligne** (« Composition : … ») sans dire ce que chacun illustre. DESIGN.md ancre `recipes-list`, `photo-prompt`, `products-catalog`, `meal-plan` aux sections ; **ne lie pas** `shell-nav.html`, `shopping-mode.html`, `macro-synthesis.html`. *Fix:* un lien inline + une phrase d’illustration par fichier, à la section qui l’own.
- **medium** Mocks anciens (`shell-nav`, `shopping-mode`, `macro-synthesis`) encore en `#121212` / `#7CB87C` / `#1E1E1E` (décision memlog initiale / addendum), pas la forêt `{colors.surface-base}` `#1A1F1A` / `{colors.accent-positive}` `#8FBC8F`. Conflit mock ↔ spine ; la clause spines-win existe, mais un consommateur qui « copie le HTML » dérive. *Fix:* réaligner ces 3 mocks ou les marquer `obsolete-palette`.
- **low** `.working/key-recipes-list.html` et `.working/key-photo-prompt.html` orphelins (non liés, déjà promus). (`.working/` ; memlog « Mocks promus »). *Fix:* supprimer ou pointer « source de promotion, ne pas implémenter ».

## 6. Bloat & overspecification — adequate

Le corps DESIGN.md porte une voix éditoriale légitime (forêt / maison-magasin). EXPERIENCE.md reste surtout tabulaire. Le picker cascade post-MVP et les « Product-Specific Sections » sont longs mais **décisionnels** (AD-3, AD-14, backup blobs, régénération). Peu de restatement PRD (pas de personas recopiés, pas de liste FR).

### Findings

- **low** Pixels déjà tokenisés répétés en prose : hero « 180 px », vignette « 72 px », barre « Hauteur 8px », bandeau « ~100 px » (DESIGN.md § Components / Do's). *Fix:* ne citer que `{components.recipe-hero.height}` etc.
- **low** § « Picker recherche unifiée (post-MVP) » (EXPERIENCE.md) est un mini-PRD (6 sources, debounce, badges). Utile si E10–E11 sont le next build ; hors contrat MVP il dilue l’extract. *Fix:* garder la cascade verrouillée, déplacer le détail comportemental vers un addendum post-MVP.

## 7. Inheritance discipline — thin

`sources` DESIGN.md : 5 chemins relatifs (prd, addendum PRD, ARCHITECTURE-SPINE, SPEC, project-context) — **tous résolvent**. `sources` EXPERIENCE.md : 6 chemins (idem moins project-context, plus SOLUTION-DESIGN.md + DESIGN.md) — **tous résolvent**. Tokens EXPERIENCE `{colors.*}` / `{components.*}` matchent DESIGN.md. Inspiration alignée memlog (maison visuelle / magasin nu, E9.2 levé).

### Findings

- **high** Cold start **contradictoire avec le code livré** : EXPERIENCE.md Surface 5 = « dernier onglet visité ou Garde-manger (défaut) ». L’app (`resolveStartupPath`) : onboarding si `onboardingCompleted !== true` et zéro recette, sinon `/home` sauf `hideHomeOnStartup` → `/pantry`. Un story-dev qui suit la spine **cassera** Accueil. (EXPERIENCE.md § Surface 5 ; `src/app/app.routes.ts`). *Fix:* réécrire le cold start **après** décision UX explicite (ne pas copier le code en silence).
- **high** Accès Paramètres divergent **dans la paire** : DESIGN.md Layout « engrenage sur **Garde-manger** ou overflow » vs EXPERIENCE.md « n’importe quel écran » / « header droit (tous écrans) ». (DESIGN.md § Layout & Spacing ; EXPERIENCE.md § Navigation globale + Surface 5). *Fix:* une phrase identique ; le code actuel (titre → Accueil, engrenage global) n’est commis nulle part.
- **medium** UJ / exigences non repris verbatim : UJ-1 tronqué ; UJ-3 omis ; FR jamais cités dans les Key Flows (seuls UJ-1 / UJ-2). Glossaire PRD « Produit » (une entité) vs spines « Product + ProductReference » (SPEC / AD-3) — correct vis-à-vis de l’architecture, **non identique** au PRD. *Fix:* une note d’héritage « glossaire = SPEC, pas PRD §3 » + UJ-3.
- **medium** Frontmatter `sources` non jumelés : DESIGN.md inclut `project-context.md` (E12 y est nommé) ; EXPERIENCE.md ne l’a pas. EXPERIENCE.md inclut `SOLUTION-DESIGN.md` ; DESIGN.md ne l’a pas. E12 n’est source d’aucun des deux de façon opérationnelle. *Fix:* aligner la liste ; si E12 est in-scope, l’ajouter et extraire.
- **low** Memlog L6 « Thème sombre #121212, accents sauge #7CB87C » vs tokens forêt — décision E9 plus récente, mais la première ligne n’est pas marquée superseded. *Fix:* `memlog.py append` override couleurs.

## 8. Shape fit — strong

DESIGN.md : Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts — ordre canonique, aucune section hors séquence.

EXPERIENCE.md defaults présents : Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows. Applicables déclenchés : Inspiration & Anti-patterns (MyFitnessPal, streaks, magazine food, E9.2 — memlog + sources) ; Responsive & Platform (Android scan / iOS saisie / desktop 428 px). Inventées : Surfaces 1–5, picker cascade, Product-Specific (catalogue, variantes, visuels, régénération) — chacune porte une règle AD / memlog, pas du narratif.

### Findings

- **low** Aucune section default manquante. Le bloc « Product-Specific Sections » est justifié ; veiller à ce qu’il ne redevienne pas un second IA. *(pas de fix bloquant)*

## Mechanical notes

- **Noms** : kebab frontmatter (`product-card`, `macro-bar`) ≠ titres prose (« Product card », « Macro progress bar ») ≠ Pascal EXPERIENCE (`ProductCard`, `MacroBarGroup`). `ScannerView` / `Scanner overlay` et `FoodCategoryLabel` / `Food category icon` sont les pires pour un extract.
- **Cross-refs** : tous les `{path.to.token}` résolvent. `{typography.meta}` et `{components.surface-banner}` pointent des **objets** (rôle / composant), pas un scalaire — acceptable comme les exemples, à documenter. Aucun Mermaid. Cascade picker en fence texte, pas un graphe.
- **Frontmatter** : DESIGN.md a `name`, `description`, `status: final`, `created`, `updated: 2026-09-02`, `sources`, tokens complets. EXPERIENCE.md : `name`, `status: final`, dates, `sources` (inclut `DESIGN.md`). Pas de `description` EXPERIENCE (non exigé).
- **IA routes spines** : 7 routes addendum (`/pantry`…`/settings`). **Manquent** `/home`, `/onboarding`. Bottom nav reste à 5 onglets (Accueil n’est pas un onglet dans le code non plus — accès header) : décision non écrite.
- **Contradictions internes** : (1) cold start pantry vs `/home` livré ; (2) engrenage Garde-manger-only vs tous écrans ; (3) palette mocks E1 vs tokens E9.
- **Décisions produit non commises (ne pas inventer)** : contenu et états Accueil ; wizard onboarding 3 étapes / pack Ciqual / omelette ; `hideHomeOnStartup` ; emplacement du rappel FR-24 (carte Accueil dans le code) ; contrastes des paires secondaires.
