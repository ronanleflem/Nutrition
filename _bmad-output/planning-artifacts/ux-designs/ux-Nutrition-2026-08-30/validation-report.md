# Validation Report — Nutrition

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-Nutrition-2026-08-30/EXPERIENCE.md`
- **Run at:** 2026-09-02T22:45:00Z

## Overall verdict

Les spines sont un contrat extractible pour les cinq surfaces critiques d’origine (catalogue 2 niveaux, plan + variantes, synthèse, Mode Courses, shell 5 onglets) et pour la couche visuels persistants. Elles ne sont pas un contrat complet du produit actuel : UJ-3 (backup) n’a aucun Key Flow, et les surfaces livrées Accueil `/home` + onboarding `/onboarding` (Epic 12) sont absentes de l’IA, des états et des parcours.

Les lentilles accessibilité et edge-case durcissent le tableau. Le Floor « vérifie » un seul couple de contraste alors que `ink-disabled` échoue en texte AA, et les pastilles priorité restent couleur seule pour l’œil (WCAG 1.4.1). Côté chemins, Accueil / onboarding ne sont pas classés maison/magasin, le prompt photo n’est pas commis après la première recette, et la restauration / fusion des blobs n’a pas d’issue écrite. Un consommateur architecture / story-dev qui source-extrait uniquement cette paire inventera le cold start, les noms de composants, et pourra livrer une image cassée à l’import.

## Category verdicts

- Flow coverage — thin
- Token completeness — adequate
- Component coverage — thin
- State coverage — adequate
- Visual reference coverage — adequate
- Bloat & overspecification — adequate
- Inheritance discipline — thin
- Shape fit — strong

## Findings by severity

### Critical (4)

**Flow coverage** — UJ-3 sans Key Flow (§ EXPERIENCE.md Key Flows ; PRD §2.3 UJ-3)
Paramètres n’apparaissent que comme tap engrenage (Flow 5). Ni export chiffré, ni import mot de passe, ni climax « données identiques », ni échec mot de passe / fichier corrompu. CAP-8 / FR-22–FR-24 / AD-10 restent sans parcours UX.
Fix: ajouter un Flow 7 Ronan nommé, étapes Paramètres → Exporter (clair / `.enc`) → nouvel appareil → Importer, climax restauration, échecs mot de passe et validation schéma ; traiter FR-24 (rappel 30 jours) dans le même flow ou un état dédié.

**Accessibility** — Contraste : le Floor sur-déclare AA (§ EXPERIENCE.md Accessibility Floor ; DESIGN.md Colors)
Seul `{colors.ink-primary}` / `{colors.surface-base}` a une cible (≥ 4.5:1). `ink-disabled` `#6B756B` fait 3.49:1 sur `surface-base`, 3.03:1 sur `surface-raised`, 2.56:1 sur `surface-overlay` — AA texte échoué. Empty states et créneaux vides des mocks utilisent cette encre.
Fix: cibles WCAG par rôle (texte 4.5, UI 3.1) pour chaque token porteur ; interdire `ink-disabled` comme encre de CTA / placeholder / empty slot.

**Accessibility** — Priorité = couleur seule pour l’œil (§ DESIGN.md Priority badge + Do’s ; Floor ; mockups/products-catalog.html)
DESIGN exige un label texte ; le Floor réduit ça à `aria-label`. Les mocks n’ont ni texte ni aria. Luminance `priority-green` ≈ `priority-gray` : haute et basse se confondent en niveaux de gris / deutéranopie (WCAG 1.4.1).
Fix: label visible (mot ou initiale) collé à la pastille, pas seulement aria.

**Edge-case** — Accueil `/home` et onboarding `/onboarding` hors contrat maison / magasin (§ EXPERIENCE.md IA, Visuels persistants, Cold start)
Après Epic 12 l’app ouvre `/onboarding` puis `/home`. Les spines n’ont ni route, ni bandeau, ni photo. Rien ne dit si Accueil est maison (bandeau + pastilles) ou magasin nu, ni si le wizard a droit à une illustration.
Fix: ajouter `/home` et `/onboarding` à l’IA ; classer chaque surface (bandeau oui/non, photos oui/non) ; aligner le cold start — après décision produit, sans copier le code en silence.

### High (18)

**Flow coverage** — Accueil `/home` et onboarding `/onboarding` absents des Key Flows (§ EXPERIENCE.md IA, Key Flows)
Pas de parcours « première recette », pas de dashboard. Chevauche le finding critical edge-case.
Fix: commettre les surfaces et un parcours Ronan (cold start incomplet → wizard → `/home`) après capture UX.

**Token completeness** — Une seule cible de contraste chiffrée (§ DESIGN.md Colors ; Floor)
Combinaisons porteuses sans ratio : `ink-secondary`, `ink-disabled`, `accent-positive` comme texte, icône FAB, pastilles priorité, ligne Courses à `checkedOpacity: 0.55`.
Fix: table de contrastes pour ces paires dans DESIGN.md § Colors.

**Component coverage** — Identifiants non identiques d’un fichier à l’autre (§ DESIGN.md Components ; EXPERIENCE.md Component Patterns)
`Scanner overlay` vs `ScannerView` ; `recipe-placeholder` vs `RecipePhotoPlaceholder` ; `Variant picker chip row` vs `VariantChipRow` ; `macro-bar` vs `MacroBarGroup` ; `Food category icon` vs `FoodCategoryLabel`. kebab vs Pascal.
Fix: une clé canonique par composant (kebab frontmatter = titre DESIGN = première colonne EXPERIENCE).

**Component coverage** — `bottom-nav` et `fab-scan` sans ligne comportementale (§ DESIGN.md tokens ; EXPERIENCE.md table)
Spec visuelle seulement. Auto-start caméra, masquage Mode Courses, 5 destinations, overflow : éparpillés dans l’IA.
Fix: deux lignes dans Component Patterns.

**State coverage** — Aucun état Accueil ni onboarding (§ State Patterns vs app livrée)
Chargement, cartes vides, carte rappel export, étapes wizard, skip macros, abandon recette, relance depuis Paramètres : tournent dans l’app, non commis.
Fix: étendre IA + State Patterns après capture ; ne pas inventer les microcopies.

**Inheritance discipline** — Cold start contradictoire avec le code livré (§ EXPERIENCE.md Surface 5 ; `app.routes.ts`)
Spine : dernier onglet ou Garde-manger. App : onboarding si zéro recette, sinon `/home` sauf `hideHomeOnStartup` → `/pantry`. Un story-dev qui suit la spine cassera Accueil.
Fix: réécrire le cold start après décision UX explicite.

**Inheritance discipline** — Accès Paramètres divergent dans la paire (§ DESIGN.md Layout vs EXPERIENCE.md Surface 5)
DESIGN : engrenage sur Garde-manger ou overflow. EXPERIENCE : header droit, tous écrans.
Fix: une phrase identique.

**Accessibility** — Vignettes OFF sans règle alt (§ Floor l.230 ; ProductThumb)
Photos recettes `alt` = titre ; bandeaux / placeholders `aria-hidden`. Aucune règle pour l’image OFF (liste, preview scan, import).
Fix: trancher décoratif (`alt=""`) **ou** `alt` = nom produit / marque OFF.

**Accessibility** — Permission galerie absente (§ PhotoPrompt, State Caméra refusée, Flow 6)
Caméra refusée spécifiée. Refus galerie / fichiers : aucun état, aucun message.
Fix: ajouter l’état « galerie / fichiers refusés » sans inventer le copy.

**Accessibility** — Mode Courses coché : encodage et nom accessible (§ shopping-row ; Surface 4 ; mock shopping-mode)
Tap ligne entière vs zone 52 px vs tap nom = éditer. Mock sans `aria-checked`. Badge « manuel » ~2.7:1. Opacité 0.55 sur `ink-secondary` ~3.8:1.
Fix: `aria-checked` + nom ; conserver le barré ; cible de contraste après fade.

**Accessibility** — Focus visible cantonné au « debug desktop » (§ Floor)
WCAG 2.4.7 n’est pas un luxe Paramètres.
Fix: focus ring visible sur tout contrôle, toutes surfaces.

**Accessibility** — Cibles tactiles : vignettes vs cartes (§ Layout ; recipe-thumb 72 ; plan-slot-thumb 40)
Rien n’écrit que la carte / le créneau est la hit zone. Risque : pastilles Plan 40 px cliquables.
Fix: hit target = carte / créneau / ligne ≥ 44 ; chips et actions photo ≥ 44.

**Accessibility** — ScannerView auto-start vs iOS sans scan (§ ScannerView, Responsive, Flow 2)
Risque de prompt caméra iOS inutile. Overlay + hint sans token / ratio.
Fix: Auto-start = Android ; iOS = saisie d’emblée ; token + ratio pour le hint hors cadre.

**Edge-case** — Première recette onboarding sans PhotoPrompt (§ PhotoPrompt, Flow 6 ; app `from=onboarding`)
Omelette template et recette custom enchaînent vers `/home` sans Galerie / Caméra / Plus tard.
Fix: commit — prompt après omelette et custom (puis Accueil), ou skip explicite + placeholder + ajout depuis le détail.

**Edge-case** — Restauration d’un blob manquant (§ Visuels persistants Backup ; FR-23, UJ-3)
L’export inclut toujours les blobs ; l’import ne dit pas quoi faire si `photoId` pointe vers un blob absent. Risque : `<img>` cassée (interdit : pas de case vide).
Fix: blob manquant ≡ sans photo (placeholder / picto) ; résumé d’import compte les visuels restaurés vs manquants.

**Edge-case** — Fusion import des photos (§ Backup ; FR-23 §10.4 ; AD-10)
Local a une photo, import sans blob : perte ? Les deux ont une photo : laquelle gagne ? Blobs absents des tables de fusion.
Fix: étendre §10 — recette : photo import gagne si présente, sinon conserver la locale ; OFF : blob suit la ref fusionnée.

**Edge-case** — Échec quota au changement de photo (§ State Photo / quota échoué ; RecipeHero)
« Placeholder » à l’échec efface la photo déjà affichée alors que le blob précédent est encore là.
Fix: scinder add vs replace — add échoué → placeholder ; replace échoué → garder l’ancienne photo + le même message.

**Edge-case** — Sorties PhotoPrompt hors des trois actions (§ PhotoPrompt, Flow 6)
Retour système, annulation du picker, mise en arrière-plan : non couverts. Recette déjà sauvée.
Fix: toute sortie sans fichier = Plus tard ; retour du picker vide = rester sur le prompt.

### Medium (23)

**Flow coverage** — Titre UJ-1 non verbatim (§ Flow 1 ; PRD §2.3)
PRD « Ronan planifie sa semaine le dimanche soir » vs Flow 1 « Ronan planifie sa semaine (UJ-1) ».
Fix: recopier le libellé PRD mot pour mot.

**Flow coverage** — Flow 5 sans climax ni échec (§ EXPERIENCE.md Flow 5)
Fix: rétrograder en règle IA, ou ajouter climax « toute surface en ≤ 2 taps » et un échec.

**Token completeness** — `scan-overlay` en rgba, pas hex (§ DESIGN.md frontmatter)
Fix: token hex + alpha séparé, ou note « overlay = exception alpha ».

**Component coverage** — EXPERIENCE seulement, sans rangée DESIGN : `WeekGrid`, `StoreModeHeader`, `RegenerateBanner`, `BottomSheet`
Fix: dual spec ou héritage explicite « chrome shell, pas de delta visuel ».

**Component coverage** — Composants livrés absents des deux spines (cartes Accueil, chrome wizard, lien titre → `/home`)
Fix: les ajouter seulement après décision UX capturée.

**State coverage** — « Liste vide » omet Garde-manger et Liste de Courses ; Objectifs sans état première visite
Fix: trois lignes empty + CTA.

**State coverage** — Aucune ligne Focus alors que l’a11y impose un focus visible
Fix: une ligne Focus globale (ring token ou native).

**Visual reference coverage** — 7 mocks listés en une ligne IA sans dire ce que chacun illustre ; DESIGN ne lie pas `shell-nav`, `shopping-mode`, `macro-synthesis`
Fix: un lien inline + une phrase d’illustration par fichier.

**Visual reference coverage** — Mocks anciens encore en `#121212` / `#7CB87C` (shell-nav, shopping-mode, macro-synthesis)
Conflit mock ↔ spine forêt. Clause spines-win existe, mais un consommateur qui copie le HTML dérive.
Fix: réaligner ces 3 mocks ou les marquer `obsolete-palette`.

**Inheritance discipline** — UJ / exigences non repris verbatim ; glossaire PRD « Produit » vs spines Product + ProductReference
Fix: note d’héritage « glossaire = SPEC, pas PRD §3 » + UJ-3.

**Inheritance discipline** — Frontmatter `sources` non jumelés (project-context vs SOLUTION-DESIGN) ; E12 n’est source opérationnelle d’aucun des deux
Fix: aligner la liste ; si E12 est in-scope, l’ajouter et extraire.

**Accessibility** — Macros : chiffres oui, état sous/atteint/dépassé uniquement en couleur
Fix: aria (et idéalement texte) de l’état.

**Accessibility** — `alt` = titre : titre vide / doublon ; `PlanSlotThumb` photo hors Floor
Fix: fallback alt si titre blanc ; pastille Plan = même règle que placeholder (`aria-hidden`) ou alt unique.

**Accessibility** — PhotoPrompt ordre de focus incomplet (focus initial, restore picker, Caméra retiré)
Fix: focus initial + restore ; si Caméra retiré, hors tab order.

**Accessibility** — `prefers-reduced-motion` trop étroit (seulement transitions > 100 ms)
Fix: étendre aux sheets / swipe / scan chrome.

**Accessibility** — Toasts sans live region ; long-press sans équivalent clavier ; focus trap sheet seulement « si formulaire »
Fix: `aria-live` pour toasts ; menu aussi via clavier ; trap sur tout sheet interactif.

**Accessibility** — Score chip et étoiles sans nom accessible
Fix: nom accessible (score, note /5).

**Edge-case** — Titre vide à la création : copy prompt et `alt` sans nom. L’app bloque (`pattern(/\S/)`) — ce n’est pas le contrat.
Fix: titre non blanc requis avant enregistrement (donc avant prompt).

**Edge-case** — Galerie / fichiers refusés (chevauche a11y high)
Fix: état « galerie indisponible » ; Plus tard toujours possible.

**Edge-case** — FR-24 rappel vs bandeau de surface vs « aucun bandeau » magasin
L’app pose le rappel sous le header (hors Mode Courses / onboarding) : il s’empile avec le bandeau 100 px et apparaît sur Courses / Objectifs / Paramètres.
Fix: le rappel FR-24 n’est pas un `SurfaceBanner` ; le classer et régler l’empilement.

**Edge-case** — « Aucun bandeau » liste Courses vs `RegenerateBanner` + liste vide
`RegenerateBanner` est un bandeau texte ; « aucun bandeau » peut le faire supprimer. Liste Courses vide et Mode Courses à 0 item : pas d’état.
Fix: `RegenerateBanner` = exception texte ; EmptyState Courses ; Mode Courses interdit ou no-op si liste vide.

**Edge-case** — Vignettes hors listes maison (picker recette, synthèse, carte Accueil)
Fix: picker = mêmes thumbs que la liste (ou texte assumé) ; synthèse et Accueil : pastille ou texte seul.

**Edge-case** — Export chiffré plus lourd : pas de taille estimée, pas de progression, pas d’échec mémoire / share iOS
Fix: état d’échec (même famille que « Téléchargement impossible ») et avertissement avant chiffrement si seuil dépassé.

### Low (13)

**Flow coverage** — Flow 4 (variante jour J) sans échec (variante manquante, recette archivée).
Fix: un cas limite si la famille n’a plus qu’une variante.

**Token completeness** — Tokens jamais référencés : `surface-inset`, `accent-info`, `border-strong`.
Fix: les lier à un usage ou les retirer.

**State coverage** — Recherche catalogue vide et « Produits archivés » vides non décrits.
Fix: une ligne chacune si ces listes restent des surfaces.

**Visual reference coverage** — `.working/key-*.html` orphelins (déjà promus).
Fix: supprimer ou pointer « source de promotion, ne pas implémenter ».

**Bloat** — Pixels déjà tokenisés répétés en prose (180 px, 72 px, 8px, ~100 px).
Fix: ne citer que `{components.recipe-hero.height}` etc.

**Bloat** — § Picker recherche unifiée (post-MVP) dilue l’extract MVP.
Fix: garder la cascade verrouillée, déplacer le détail vers un addendum post-MVP.

**Inheritance** — Memlog L6 `#121212` / `#7CB87C` vs tokens forêt, première ligne non marquée superseded.
Fix: `memlog.py append` override couleurs.

**Shape fit** — « Product-Specific Sections » justifié ; veiller à ce qu’il ne redevienne pas un second IA.

**Accessibility** — Paires sans cible alors qu’elles passent (`ink-secondary`, `ink-warm`, `accent-positive`) ; `accent-positive-muted` picto ~3.01:1.
Fix: cibles écrites ; interdire texte/badge overlay photo partout.

**Accessibility** — Mocks magasin / shell encore sur l’ancienne palette.
Fix: les stories lisent les spines, pas ces trois mocks, pour la couleur.

**Edge-case** — Retirer la photo sans confirmation (destructif non listé).
Fix: retrait immédiat + toast, ou dialog court ; après retrait = placeholder partout.

**Edge-case** — Ref préférée archivée → quelle vignette.
Fix: si la préférée n’a plus d’image exploitable → picto.

**Edge-case** — Format image illisible (HEIC / vidéo) : pas d’état distinct du quota.
Fix: même issue que quota — recette intacte, photo précédente conservée si replace.

## Reviewer files

- `review-rubric.md`
- `review-accessibility.md`
- `review-edge-case.md`

## Mechanical notes

- Noms : kebab frontmatter ≠ titres prose ≠ Pascal EXPERIENCE. `ScannerView` / `Scanner overlay` et `FoodCategoryLabel` / `Food category icon` sont les pires pour un extract.
- Cross-refs : tous les `{path.to.token}` résolvent. Aucun Mermaid.
- Frontmatter DESIGN.md / EXPERIENCE.md : `status: final`, `updated: 2026-09-02`, sources relatives toutes résolubles.
- IA routes spines : 7 routes addendum. Manquent `/home`, `/onboarding`.
- Contradictions internes : (1) cold start pantry vs `/home` livré ; (2) engrenage Garde-manger-only vs tous écrans ; (3) palette mocks E1 vs tokens E9.
- Décisions produit non commises (ne pas inventer) : contenu et états Accueil ; wizard onboarding ; `hideHomeOnStartup` ; emplacement FR-24 ; contrastes des paires secondaires.
