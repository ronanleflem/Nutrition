# Addendum — Nutrition (brief 2026-08-30)

Contenu de profondeur pour les phases PRD et architecture. Non inclus dans le brief exécutif.

## Contraintes techniques verrouillées

| Décision | Choix | Raison |
|----------|-------|--------|
| Forme | PWA Angular mobile-first | Skills du développeur ; pas de stack mobile native |
| Données | 100 % local (IndexedDB) | App perso ; minimiser surface d’attaque |
| Backend MVP | Aucun | Pas de serveur à sécuriser ni maintenir |
| Sauvegarde | Export / import JSON chiffré | Éviter perte de données sans cloud |
| Utilisateur | Single-user | Pas d’auth multi-compte au MVP |
| APIs externes | Open Food Facts (lecture seule) | Enrichissement produit ; pas d’envoi de données perso |
| Langue | Français (UI + docs) | Usage personnel France |
| Unités | Grammes uniquement | Simplicité MVP ; pièces/cuillères en v1.1 |
| Scan code-barres | MVP avec repli manuel | `@zxing/ngx-scanner` + API OFF |
| Objectifs macros | MVP | Cibles journalières ; synthèse plan vs objectifs |

## Architecture cible (haute niveau)

```
┌─────────────────────────────────────┐
│  Angular PWA (Service Worker)       │
│  ┌───────────────────────────────┐  │
│  │ Couche domaine (services)     │  │
│  │ Pantry · Products · Recipes   │  │
│  │ MealPlan · ShoppingList       │  │
│  │ Backup (encrypt/decrypt)      │  │
│  └──────────────┬────────────────┘  │
│  ┌──────────────▼────────────────┐  │
│  │ IndexedDB (Dexie ou idb)      │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │ HTTPS GET (optionnel)
               ▼
        Open Food Facts API
```

## Modèle de données (draft)

- `Product` — nom, marque, barcode?, macros pour 100 g (kcal, protéines, lipides, glucides, fibres), ingrédients, tags santé
- `MacroGoals` — kcal, protéines, lipides, glucides, fibres (cibles journalières, grammes sauf kcal)
- `PantryItem` — productId, quantité (g), DLC?, emplacement?
- `Recipe` — titre, étapes, temps, portions, tags
- `RecipeIngredient` — recipeId, productId, quantité (g)
- `MealPlanEntry` — date, slot (petit-déj/déj/dîner), recipeId
- `ShoppingListItem` — productId, quantité, coché, source (auto|manuel)

## Export / import — exigences

- Format : JSON versionné (`schemaVersion`, `exportedAt`, `data`)
- Chiffrement optionnel au export : AES-GCM via Web Crypto, mot de passe utilisateur
- Export non chiffré : possible pour debug local, avec avertissement UI
- Import : validation schéma, merge ou remplacement total (choix utilisateur)
- Fréquence recommandée : export manuel avant grosse mise à jour ou changement de téléphone

## Sécurité — posture MVP

| Risque | Mitigation |
|--------|------------|
| Données sur téléphone volé | Chiffrement export ; verrouillage OS du téléphone |
| XSS dans PWA | Angular sanitization ; pas d’eval ; CSP stricte |
| Fuite via cloud | Pas de cloud au MVP |
| API tierce | OFF en lecture seule ; pas de token perso |
| Perte de données | Export régulier ; message onboarding |

## Options rejetées

| Option | Pourquoi rejetée |
|--------|------------------|
| React Native / Flutter | Pas les skills ; dette invisible avec IA seule |
| Spring Boot backend | Overkill 1 user ; plus de sécu à gérer |
| Firebase / Supabase | Données perso sur infra tierce |
| Sync fichier Dropbox | Fichier non chiffré = risque compte cloud |
| SQLite sync serveur maison | Complexité réseau ; phase 2+ si besoin |

## Scan code-barres — faisabilité MVP

| Aspect | Détail |
|--------|--------|
| Librairie | `@zxing/ngx-scanner` (Angular, caméra via `getUserMedia`) |
| API produit | `GET https://world.openfoodfacts.org/api/v2/product/{barcode}` |
| Effort estimé | 1 story scanner + 1 story lookup OFF + repli manuel |
| Android Chrome PWA | Bon support, usage principal attendu |
| iOS Safari | Support partiel ; repli saisie manuelle obligatoire |
| Prérequis | HTTPS (ou localhost en dev), permission caméra |
| Offline | Scan local possible ; lookup OFF nécessite réseau |

**Verdict** : faisable au MVP sans app native. Le repli manuel n’est pas un plan B optionnel — c’est une exigence produit.

## Décisions produit validées (2026-08-30)

| # | Décision |
|---|----------|
| 1 | Scan code-barres au MVP, avec saisie manuelle + recherche OFF en repli |
| 2 | Unités en grammes uniquement (macros exprimées pour 100 g) |
| 3 | Objectifs macros personnels au MVP : kcal, protéines, lipides, glucides, fibres |
| 4 | Synthèse plan de repas vs objectifs — pas de journal MyFitnessPal |

## Questions ouvertes (pour PRD)

1. Design : thème sombre par défaut pour usage magasin ?
