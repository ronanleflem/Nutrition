# Nutrition

Application personnelle de nutrition (garde-manger, recettes, courses). Méthode BMAD pour le planning ; code Angular PWA local-first.

<!-- bmad:context -->
<!-- Verified 2026-08-30 against pending-first-commit. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## Nutrition

PWA Angular personnelle : garde-manger, recettes, planification repas, liste de courses. Données 100 % locales (IndexedDB), export/import chiffré pour sauvegarde. Planning BMAD dans `_bmad-output/planning-artifacts/` ; contexte technique dans `_bmad-output/project-context.md`.

## Policy

- Ne pas ajouter un backend (Spring, FastAPI, etc.) au MVP — données locales uniquement.
- Ne pas envoyer des données utilisateur à des APIs tierces ; Open Food Facts en lecture seule pour enrichissement produit.
- Ne pas introduire auth / comptes / sync cloud sans décision explicite dans le PRD.
- Ne pas committer des exports de données utilisateur — voir `.gitignore`.

## Where things are

- Brief produit : `_bmad-output/planning-artifacts/brief-2026-08-30/brief.md`
- Contraintes techniques : `_bmad-output/project-context.md` et `addendum.md` du même dossier brief
- Skills BMAD : `.agents/skills/` (invoker `bmad-help` pour la suite)
- Config BMAD : `_bmad/bmm/config.yaml` (langue française, projet Nutrition)

## Running and verifying

- Installer BMAD : `npx bmad-method install` (déjà fait ; modules core + bmm, outil cursor)
- Scripts BMAD build : `uv run _bmad/scripts/...` — nécessite `uv` sur PATH
- App Angular : TODO après story E1 setup — `npm start` / `ng serve` (à vérifier au premier refresh)

## Conventions that differ from defaults

- Stack cible Angular PWA + IndexedDB, pas React/Vue/mobile native.
- UI et documentation en français.
- Export backup : JSON versioné, chiffrement AES-GCM optionnel via Web Crypto.

## Known pitfalls

- Les agents tendent à proposer Firebase/Supabase — refuser ; local-first est une contrainte produit.
- Les agents tendent à ajouter un backend « pour le sync » — reporter à post-MVP.

<!-- /bmad:context -->
