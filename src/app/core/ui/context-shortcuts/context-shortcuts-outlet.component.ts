import { Component, inject, OnDestroy } from '@angular/core';

import { PantryAddSheetComponent } from '../../../features/pantry/pantry-add-sheet.component';
import { ShoppingItemSheetComponent } from '../../../features/shopping-list/components/shopping-item-sheet/shopping-item-sheet.component';
import { ContextActionMenuComponent } from './context-action-menu.component';
import { ContextShortcutsService } from './context-shortcuts.service';
import { IngredientPickSheetComponent } from './ingredient-pick-sheet.component';
import { UseInRecipeSheetComponent } from './use-in-recipe-sheet.component';

@Component({
  selector: 'app-context-shortcuts-outlet',
  imports: [
    ContextActionMenuComponent,
    PantryAddSheetComponent,
    ShoppingItemSheetComponent,
    UseInRecipeSheetComponent,
    IngredientPickSheetComponent,
  ],
  templateUrl: './context-shortcuts-outlet.component.html',
  styleUrl: './context-shortcuts-outlet.component.scss',
})
export class ContextShortcutsOutletComponent implements OnDestroy {
  protected readonly shortcuts = inject(ContextShortcutsService);

  ngOnDestroy(): void {
    this.shortcuts.reset();
  }
}
