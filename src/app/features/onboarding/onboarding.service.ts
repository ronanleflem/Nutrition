import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DatabaseService } from '../../core/database/database.service';
import {
  FoodLibraryImportService,
  type StarterPackImportSummary,
} from '../../core/food-library/food-library-import.service';
import type { UpdateMacroGoalsInput } from '../../core/models/macro-goals';
import { MacroGoalsService } from '../macro-goals/services/macro-goals.service';
import { RecipesService } from '../recipes/services/recipes.service';
import {
  OMELETTE_CIQUAL_IDS,
  OMELETTE_INGREDIENTS,
  OMELETTE_STEPS,
  OMELETTE_TITLE,
  OMELETTE_VARIANT_NAME,
} from './onboarding.constants';

export const OMELETTE_INGREDIENTS_MISSING_ERROR =
  'Impossible de trouver les ingrédients de l’omelette (œuf, beurre, sel). Importez-les depuis la bibliothèque.';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly database = inject(DatabaseService);
  private readonly foodLibrary = inject(FoodLibraryImportService);
  private readonly recipes = inject(RecipesService);
  private readonly macroGoals = inject(MacroGoalsService);
  private readonly router = inject(Router);

  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly packSummary = signal<StarterPackImportSummary | null>(null);
  readonly packImported = signal(false);
  readonly libraryVisited = signal(false);
  readonly step2Ready = computed(() => this.packImported() || this.libraryVisited());

  private resumeAfterLibrary = false;
  private resumeAfterCustom = false;

  enterWizard(): void {
    if (this.resumeAfterLibrary) {
      this.currentStep.set(2);
      this.libraryVisited.set(true);
      this.resumeAfterLibrary = false;
      return;
    }

    if (this.resumeAfterCustom) {
      this.resumeAfterCustom = false;
      this.currentStep.set(3);
      return;
    }

    this.resetWizard();
  }

  resetForRelaunch(): void {
    this.resumeAfterLibrary = false;
    this.resumeAfterCustom = false;
    this.resetWizard();
  }

  skipMacros(): void {
    this.currentStep.set(2);
  }

  async saveMacros(input: UpdateMacroGoalsInput): Promise<void> {
    await this.macroGoals.save(input);
    this.currentStep.set(2);
  }

  async importStarterPack(): Promise<StarterPackImportSummary> {
    const summary = await this.foodLibrary.importStarterPack();
    this.packSummary.set(summary);
    this.packImported.set(summary.added + summary.alreadyPresent > 0);
    return summary;
  }

  markLibraryVisit(): void {
    this.libraryVisited.set(true);
    this.resumeAfterLibrary = true;
  }

  goToStep3(): void {
    if (!this.step2Ready()) {
      return;
    }

    this.currentStep.set(3);
  }

  startCustomRecipe(): Promise<boolean> {
    this.resumeAfterLibrary = false;
    this.resumeAfterCustom = true;
    return this.router.navigate(['/recipes/new'], { queryParams: { from: 'onboarding' } });
  }

  async createOmeletteAndFinish(): Promise<void> {
    const ingredients = await this.resolveOmeletteIngredients();
    const result = await this.recipes.createRecipeWithFirstVariant({
      recipe: {
        title: OMELETTE_TITLE,
        steps: [...OMELETTE_STEPS],
        defaultPortions: 1,
      },
      variantName: OMELETTE_VARIANT_NAME,
      ingredients,
    });

    this.resumeAfterLibrary = false;
    this.resumeAfterCustom = false;
    this.resetWizard();
    await this.navigateToPhotoPrompt(result.recipe.id, true);
  }

  async finishAfterPhotoPrompt(): Promise<void> {
    await this.completeAndGoHome();
  }

  async completeAfterCustomRecipe(): Promise<void> {
    await this.finishAfterPhotoPrompt();
  }

  async navigateToPhotoPrompt(recipeId: string, fromOnboarding = false): Promise<void> {
    await this.router.navigate(['/recipes', recipeId, 'photo-prompt'], {
      queryParams: fromOnboarding ? { from: 'onboarding' } : undefined,
    });
  }

  private resetWizard(): void {
    this.currentStep.set(1);
    this.packSummary.set(null);
    this.packImported.set(false);
    this.libraryVisited.set(false);
  }

  private async completeAndGoHome(): Promise<void> {
    this.resumeAfterLibrary = false;
    this.resumeAfterCustom = false;
    await this.database.updateOnboardingCompleted(true);
    this.resetWizard();
    await this.router.navigateByUrl('/home');
  }

  private async resolveOmeletteIngredients(): Promise<
    Array<{ productId: string; quantityG: number }>
  > {
    let resolved = await this.findOmeletteIngredients();
    if (resolved) {
      return resolved;
    }

    await this.foodLibrary.importStarterPack(OMELETTE_CIQUAL_IDS);
    resolved = await this.findOmeletteIngredients();
    if (!resolved) {
      throw new Error(OMELETTE_INGREDIENTS_MISSING_ERROR);
    }

    return resolved;
  }

  private async findOmeletteIngredients(): Promise<
    Array<{ productId: string; quantityG: number }> | null
  > {
    const catalog = await this.database.listProductCatalog();
    const ingredients: Array<{ productId: string; quantityG: number }> = [];

    for (const item of OMELETTE_INGREDIENTS) {
      const match = catalog.find((entry) => entry.product.sourceId === item.sourceId);
      if (!match) {
        return null;
      }

      ingredients.push({ productId: match.product.id, quantityG: item.quantityG });
    }

    return ingredients;
  }
}
