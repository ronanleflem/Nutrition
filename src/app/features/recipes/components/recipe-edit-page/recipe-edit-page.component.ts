import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { RecipesService } from '../../services/recipes.service';

@Component({
  selector: 'app-recipe-edit-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recipe-edit-page.component.html',
  styleUrl: './recipe-edit-page.component.scss',
})
export class RecipeEditPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipesService = inject(RecipesService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);

  readonly recipeId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    durationMin: [''],
    defaultPortions: [2, [Validators.required, Validators.min(1)]],
    tags: [''],
    notes: [''],
    steps: this.fb.nonNullable.array([
      this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/)]),
    ]),
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.recipeId.set(id);
          if (!id) {
            void this.router.navigate(['/recipes']);
            return of(null);
          }

          return from(this.loadRecipe(id));
        }),
      )
      .subscribe();
  }

  get steps(): FormArray {
    return this.form.controls.steps;
  }

  addStep(): void {
    this.steps.push(this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/)]));
  }

  removeStep(index: number): void {
    if (this.steps.length <= 1) {
      return;
    }
    this.steps.removeAt(index);
  }

  async loadRecipe(recipeId: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const detail = await this.recipesService.getRecipeDetail(recipeId);
      if (!detail) {
        this.loadError.set('Recette introuvable.');
        return;
      }

      const recipe = detail.recipe;
      this.form.patchValue({
        title: recipe.title,
        durationMin: recipe.durationMin?.toString() ?? '',
        defaultPortions: recipe.defaultPortions,
        tags: recipe.tags?.join(', ') ?? '',
        notes: recipe.notes ?? '',
      });

      this.steps.clear();
      for (const step of recipe.steps) {
        this.steps.push(this.fb.nonNullable.control(step, [Validators.required, Validators.pattern(/\S/)]));
      }
      if (this.steps.length === 0) {
        this.addStep();
      }
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Impossible de charger la recette.');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    const recipeId = this.recipeId();
    if (!recipeId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const defaultPortions = Number(raw.defaultPortions);
    if (!Number.isFinite(defaultPortions) || defaultPortions < 1) {
      this.submitError.set('Le nombre de portions doit être supérieur à 0.');
      return;
    }

    const durationMin = raw.durationMin ? Number(raw.durationMin) : undefined;
    if (durationMin != null && (!Number.isFinite(durationMin) || durationMin < 1)) {
      this.submitError.set('La durée doit être un nombre supérieur ou égal à 1 minute.');
      return;
    }

    const tags = raw.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    this.saving.set(true);
    this.submitError.set(null);

    try {
      await this.recipesService.updateRecipe(recipeId, {
        title: raw.title,
        steps: raw.steps,
        durationMin,
        defaultPortions,
        tags: tags.length > 0 ? tags : undefined,
        notes: raw.notes || undefined,
      });

      await this.router.navigate(['/recipes', recipeId]);
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Impossible de modifier la recette.');
    } finally {
      this.saving.set(false);
    }
  }
}
