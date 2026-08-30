import { Injectable } from '@angular/core';

import type { RecipeVariantDetail } from '../models/recipe-detail';
import {
  calculateVariantMacros,
  roundRecipeMacros,
  type RecipeMacroBreakdown,
} from '../models/recipe-macros';

@Injectable({ providedIn: 'root' })
export class RecipeMacroService {
  calculateForVariant(variant: RecipeVariantDetail, defaultPortions: number): RecipeMacroBreakdown {
    const breakdown = calculateVariantMacros(
      variant.ingredients.map((ingredient) => ({
        quantityG: ingredient.quantityG,
        macrosPer100g: ingredient.macrosPer100g,
      })),
      defaultPortions,
    );

    return {
      total: roundRecipeMacros(breakdown.total),
      perPortion: roundRecipeMacros(breakdown.perPortion),
      incomplete: breakdown.incomplete,
    };
  }
}
