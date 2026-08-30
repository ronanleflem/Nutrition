---
title: "Product Brief — Nutrition"
status: draft
created: 2026-08-30
updated: 2026-08-30
---

# Product Brief : Nutrition

## Résumé exécutif

Nutrition est une application **personnelle** pour faciliter une alimentation saine au quotidien : gérer ce qu’on a au garde-manger, choisir des produits avec de bons macros et ingrédients, planifier des repas et générer des listes de courses intelligentes.

L’objectif n’est pas de rivaliser avec MyFitnessPal ou les apps grand public, mais de **réduire la charge cognitive** : savoir quoi acheter, où le trouver, et quelles recettes healthy sont réalisable avec le stock disponible.

L’application tourne **100 % en local** sur le téléphone (PWA Angular), sans compte cloud ni serveur exposé au MVP. Les données personnelles (garde-manger, préférences, historique) restent sur l’appareil, avec **import / export chiffré** pour sauvegarde et restauration.

## Le problème

Aujourd’hui, manger sain demande beaucoup d’effort mental :

- Comparer les marques (macros, sucres, additifs) en magasin est fastidieux.
- Le garde-manger est une « boîte noire » : on achète en double ou on oublie ce qu’on a.
- Planifier la semaine et dériver la liste de courses depuis les recettes est chronophage.
- Les apps existantes ciblent le suivi calorique ou le social, pas le **parcours courses + cuisine** pour un usage solo.

**Coût du statu quo** : temps perdu en magasin, achats redondants, recettes abandonnées par manque d’ingrédients, frustration.

## La solution

Une PWA mobile-first (installable sur l’écran d’accueil) qui centralise :

1. **Garde-manger** — produits, quantités, dates de péremption.
2. **Catalogue produits** — marque, macros, ingrédients, score santé simplifié.
3. **Recettes healthy** — ingrédients liés au catalogue, macros par portion.
4. **Planification** — repas de la semaine.
5. **Liste de courses** — générée automatiquement (recettes planifiées − stock disponible).
6. **Sauvegarde** — export JSON chiffré ; import pour restauration ou migration.

Mode « courses » : liste à cocher, regroupement par rayon, consultation rapide des macros.

## Ce qui différencie ce projet

- **Usage perso** — pas de multi-tenant, pas de SaaS : simplicité et contrôle des données.
- **Local-first** — pas de dépendance serveur pour le quotidien ; surface d’attaque minimale.
- **Parcours intégré** — du plan de repas à la liste de courses, pas seulement un tracker.
- **Comparateur marques** (post-MVP) — classement par critère nutritionnel pour faciliter le choix en magasin.
- **Mapping enseignes** (post-MVP) — où trouver un produit (Carrefour, Lidl, etc.).

Pas de « moat » technique revendiqué : l’avantage est l’**alignement exact** avec un usage personnel et un workflow courses-cuisine.

## Qui est servi

**Utilisateur principal** : développeur (Java / Angular / Python), usage solo, France, souhaite manger plus sain sans y passer des heures.

**Succès pour lui** :

- Préparer la liste de courses du week-end en quelques minutes.
- En magasin, choisir rapidement la meilleure option parmi 2–3 marques.
- À la maison, voir « ce que je peux cuisiner ce soir » avec le stock actuel.
- Ne jamais perdre ses données grâce à l’export régulier.

## Critères de succès

| Signal | Mesure |
|--------|--------|
| Temps de préparation courses | < 10 min pour planifier une semaine |
| Liste utile | ≥ 80 % des items générés sont réellement achetés |
| Confiance données | Export / import testé sans perte |
| Usage offline | Garde-manger et liste de courses fonctionnels sans réseau |
| Sécurité perçue | Aucune donnée perso envoyée à un serveur tiers (hors API lecture seule OFF) |

## Périmètre

### Dans le MVP

- PWA Angular, stockage local (IndexedDB)
- CRUD produits, garde-manger, recettes (quantités en **grammes** uniquement)
- Scan code-barres caméra + recherche Open Food Facts, avec **saisie manuelle en repli**
- Objectifs macros personnels (kcal, protéines, lipides, glucides, fibres / jour)
- Synthèse macros du plan de repas vs objectifs (pas de journal alimentaire repas par repas)
- Planification repas (semaine courante)
- Liste de courses auto + édition manuelle
- Import / export chiffré (Web Crypto API)

### Explicitement hors MVP

- Backend / sync multi-appareils
- Comptes utilisateurs et authentification
- Journal alimentaire détaillé type MyFitnessPal (saisie de chaque bouchée consommée)
- Unités pièces / cuillères / volumes
- Commande en ligne, budget, partage familial
- IA génération de recettes
- App native (React Native, Flutter)

## Vision (2–3 ans)

Si le produit répond au besoin quotidien, il peut évoluer vers :

- Comparateur marques et score santé enrichi (NOVA, additifs)
- Mapping produit ↔ enseigne (saisie manuelle puis crowdsourcing perso)
- Sync optionnelle via backup chiffré sur PC (pas de cloud obligatoire)
- Suggestions de recettes selon stock et objectifs macros

Toujours **perso-first** : pas de pivot vers un produit grand public sans décision explicite.
