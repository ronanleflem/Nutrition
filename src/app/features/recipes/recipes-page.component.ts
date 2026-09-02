import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContextShortcutsOutletComponent } from '../../core/ui/context-shortcuts/context-shortcuts-outlet.component';
import { ContextShortcutsService } from '../../core/ui/context-shortcuts/context-shortcuts.service';
import { LongPressDirective } from '../../core/ui/context-shortcuts/long-press.directive';
import type { RecipeListItem } from '../../core/models/recipe-list-item';
import { EmptyStateComponent } from '../products/components/empty-state/empty-state.component';
import { RecipesService } from './services/recipes.service';

@Component({
  selector: 'app-recipes-page',
  imports: [RouterLink, EmptyStateComponent, LongPressDirective, ContextShortcutsOutletComponent],
  templateUrl: './recipes-page.component.html',
  styleUrl: './recipes-page.component.scss',
})
export class RecipesPageComponent implements OnInit {
  private readonly recipesService = inject(RecipesService);
  private readonly shortcuts = inject(ContextShortcutsService);

  readonly recipes = this.recipesService.recipes;
  readonly loading = this.recipesService.loading;
  readonly hasRecipes = computed(() => this.recipes().length > 0);

  ngOnInit(): void {
    void this.recipesService.loadRecipes();
  }

  openShortcut(item: RecipeListItem, fromLongPress = false): void {
    this.shortcuts.openMenu(
      {
        kind: 'recipe',
        recipeId: item.recipe.id,
        recipeTitle: item.recipe.title,
      },
      { fromLongPress },
    );
  }

  onMenuClick(event: Event, item: RecipeListItem): void {
    event.preventDefault();
    event.stopPropagation();
    this.openShortcut(item);
  }
}
