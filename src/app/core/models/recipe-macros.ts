import type { ProductReferenceMacros } from './product-reference';

export interface RecipeMacros {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
}

export interface RecipeIngredientMacroInput {
  quantityG: number;
  macrosPer100g?: ProductReferenceMacros;
}

export interface RecipeMacroBreakdown {
  total: RecipeMacros;
  perPortion: RecipeMacros;
  incomplete: boolean;
}

export const EMPTY_RECIPE_MACROS: RecipeMacros = {
  kcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
  fiberG: 0,
};

export function scaleMacrosPerQuantity(
  macrosPer100g: ProductReferenceMacros,
  quantityG: number,
): RecipeMacros {
  const factor = quantityG / 100;

  return {
    kcal: macrosPer100g.kcalPer100g * factor,
    proteinG: macrosPer100g.proteinPer100g * factor,
    fatG: macrosPer100g.fatPer100g * factor,
    carbsG: macrosPer100g.carbsPer100g * factor,
    fiberG: (macrosPer100g.fiberPer100g ?? 0) * factor,
  };
}

export function addRecipeMacros(left: RecipeMacros, right: RecipeMacros): RecipeMacros {
  return {
    kcal: left.kcal + right.kcal,
    proteinG: left.proteinG + right.proteinG,
    fatG: left.fatG + right.fatG,
    carbsG: left.carbsG + right.carbsG,
    fiberG: left.fiberG + right.fiberG,
  };
}

export function sumIngredientMacros(ingredients: RecipeIngredientMacroInput[]): RecipeMacroBreakdown {
  let total = { ...EMPTY_RECIPE_MACROS };
  let incomplete = false;

  for (const ingredient of ingredients) {
    if (!ingredient.macrosPer100g) {
      incomplete = true;
      continue;
    }

    total = addRecipeMacros(total, scaleMacrosPerQuantity(ingredient.macrosPer100g, ingredient.quantityG));
  }

  return { total, perPortion: { ...EMPTY_RECIPE_MACROS }, incomplete };
}

export function macrosPerPortion(total: RecipeMacros, defaultPortions: number): RecipeMacros {
  if (!Number.isFinite(defaultPortions) || defaultPortions <= 0) {
    return { ...EMPTY_RECIPE_MACROS };
  }

  const factor = 1 / defaultPortions;

  return {
    kcal: total.kcal * factor,
    proteinG: total.proteinG * factor,
    fatG: total.fatG * factor,
    carbsG: total.carbsG * factor,
    fiberG: total.fiberG * factor,
  };
}

export function calculateVariantMacros(
  ingredients: RecipeIngredientMacroInput[],
  defaultPortions: number,
): RecipeMacroBreakdown {
  const partial = sumIngredientMacros(ingredients);

  return {
    total: partial.total,
    perPortion: macrosPerPortion(partial.total, defaultPortions),
    incomplete: partial.incomplete,
  };
}

export function roundRecipeMacros(macros: RecipeMacros): RecipeMacros {
  return {
    kcal: roundMacro(macros.kcal),
    proteinG: roundMacro(macros.proteinG),
    fatG: roundMacro(macros.fatG),
    carbsG: roundMacro(macros.carbsG),
    fiberG: roundMacro(macros.fiberG),
  };
}

export function formatRecipeMacros(macros: RecipeMacros): string {
  const rounded = roundRecipeMacros(macros);
  return `${rounded.kcal} kcal · ${rounded.proteinG} g P · ${rounded.fatG} g L · ${rounded.carbsG} g G · ${rounded.fiberG} g fibres`;
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}
