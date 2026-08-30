import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '../products/components/empty-state/empty-state.component';
import { RecipesService } from './services/recipes.service';

@Component({
  selector: 'app-recipes-page',
  imports: [RouterLink, EmptyStateComponent],
  templateUrl: './recipes-page.component.html',
  styleUrl: './recipes-page.component.scss',
})
export class RecipesPageComponent implements OnInit {
  private readonly recipesService = inject(RecipesService);

  readonly recipes = this.recipesService.recipes;
  readonly loading = this.recipesService.loading;
  readonly hasRecipes = computed(() => this.recipes().length > 0);

  ngOnInit(): void {
    void this.recipesService.loadRecipes();
  }
}
