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

- `Product` — nom, marque, barcode?, macros (kcal, protéines, lipides, glucides), ingrédients, tags santé
- `PantryItem` — productId, quantité, unité, DLC?, emplacement?
- `Recipe` — titre, étapes, temps, portions, tags
- `RecipeIngredient` — recipeId, productId, quantité, unité
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

## Questions ouvertes (pour PRD)

1. Scan code-barres caméra dès MVP ou saisie manuelle + recherche OFF ?
2. Unités : grammes uniquement ou support pièces / cuillères ?
3. Objectifs macros personnels (ex. 150g protéines/jour) — MVP ou v1.1 ?
4. Design : thème sombre par défaut pour usage magasin ?
