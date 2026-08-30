import { Injectable } from '@angular/core';

import type { ProductReferenceMacros } from '../models/product-reference';

/**
 * Single source for nutritional score (AR-6).
 * Weights: 45% protein per 100 kcal, 35% composition heuristics, 20% caloric density.
 */
@Injectable({ providedIn: 'root' })
export class NutritionalScoreService {
  calculate(macros: ProductReferenceMacros): number {
    const kcal = Math.max(macros.kcalPer100g, 1);

    const proteinPer100Kcal = (macros.proteinPer100g / kcal) * 100;
    const proteinScore = Math.min(100, proteinPer100Kcal * 10);

    const fiberBonus = Math.min(20, (macros.fiberPer100g ?? 0) * 2);
    const saltPenalty = Math.min(30, (macros.saltPer100g ?? 0) * 10);
    const macroTotal = macros.proteinPer100g + macros.fatPer100g + macros.carbsPer100g;
    const fatRatio = macroTotal > 0 ? macros.fatPer100g / macroTotal : 0;
    const compositionScore = Math.max(0, Math.min(100, 70 + fiberBonus - saltPenalty - fatRatio * 30));

    const densityScore = Math.max(0, Math.min(100, 100 - Math.max(0, kcal - 150) * 0.5));

    const total = proteinScore * 0.45 + compositionScore * 0.35 + densityScore * 0.2;
    return Math.round(Math.max(0, Math.min(100, total)));
  }
}
