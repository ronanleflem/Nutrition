import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OPENNUTRITION_INLINE_CREDIT } from '../../food-library-attribution';
import {
  isLibrarySearchHit,
  isOnlineSearchHit,
} from '../../food-library-search.types';
import { isCatalogSearchHit as isPickerCatalogHit } from '../../ingredient-picker-search';
import type { FoodSearchCascadeSection } from '../../food-search-cascade.types';
import type { IngredientSearchHit } from '../../ingredient-picker-search.types';
import { formatMacrosSummary } from '../../../models/product-reference';
import { foodCategoryLabelFromHit } from '../../../food-category/food-category-from-hit';
import { FoodCategoryLabelComponent } from '../../../ui/food-category-label/food-category-label.component';

@Component({
  selector: 'app-food-search-cascade-results',
  imports: [RouterLink, FoodCategoryLabelComponent],
  templateUrl: './food-search-cascade-results.component.html',
  styleUrl: './food-search-cascade-results.component.scss',
})
export class FoodSearchCascadeResultsComponent {
  readonly sections = input.required<FoodSearchCascadeSection[]>();
  readonly searchingOnline = input(false);
  readonly onlineSectionSources = input<string[]>(['off', 'foodrepo', 'usda']);
  readonly importingId = input<string | null>(null);
  readonly catalogActionLabel = input('Sélectionner');
  readonly libraryActionLabel = input('Ajouter à mon catalogue');
  readonly onlineActionLabel = input('Prévisualiser');

  readonly hitSelected = output<IngredientSearchHit>();

  readonly openNutritionCredit = OPENNUTRITION_INLINE_CREDIT;
  readonly isCatalogSearchHit = isPickerCatalogHit;
  readonly isOnlineSearchHit = isOnlineSearchHit;
  readonly isLibrarySearchHit = isLibrarySearchHit;
  readonly categoryLabelFromHit = foodCategoryLabelFromHit;

  formatMacros(hit: IngredientSearchHit): string {
    return formatMacrosSummary({
      kcalPer100g: hit.kcal,
      proteinPer100g: hit.proteinG,
      fatPer100g: hit.fatG,
      carbsPer100g: hit.carbsG,
      fiberPer100g: hit.fiberG,
    });
  }

  isOnlineSectionLoading(source: string): boolean {
    return this.searchingOnline() && this.onlineSectionSources().includes(source);
  }

  actionLabel(hit: IngredientSearchHit): string {
    if (isPickerCatalogHit(hit)) {
      return this.catalogActionLabel();
    }

    if (isOnlineSearchHit(hit)) {
      return this.onlineActionLabel();
    }

    return this.libraryActionLabel();
  }
}
