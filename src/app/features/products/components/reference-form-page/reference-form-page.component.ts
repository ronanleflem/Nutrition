import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { isValidEan, normalizeBarcodeInput } from '../../../../core/barcode/ean';
import type { Store } from '../../../../core/models/store';
import { STORES, STORE_LABELS } from '../../../../core/models/store';
import { ProductsService } from '../../services/products.service';

function optionalEanValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) {
    return null;
  }

  return isValidEan(normalizeBarcodeInput(value)) ? null : { ean: true };
}

@Component({
  selector: 'app-reference-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reference-form-page.component.html',
  styleUrl: './reference-form-page.component.scss',
})
export class ReferenceFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);

  readonly stores = STORES;
  readonly storeLabels = STORE_LABELS;
  readonly isEditMode = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly productId = signal<string | null>(null);

  private referenceId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    store: ['' as '' | Store, Validators.required],
    label: ['', [Validators.required, Validators.pattern(/\S/)]],
    brand: [''],
    barcode: ['', optionalEanValidator],
    kcalPer100g: [0, [Validators.required, Validators.min(0)]],
    proteinPer100g: [0, [Validators.required, Validators.min(0)]],
    fatPer100g: [0, [Validators.required, Validators.min(0)]],
    carbsPer100g: [0, [Validators.required, Validators.min(0)]],
    fiberPer100g: [null as number | null],
    saltPer100g: [null as number | null],
    ingredients: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      void this.load(params.get('productId'), params.get('refId'));
    });
  }

  async onSubmit(): Promise<void> {
    const productId = this.productId();
    if (this.form.invalid || !productId) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      store: raw.store as Store,
      label: raw.label,
      brand: raw.brand || undefined,
      barcode: raw.barcode || undefined,
      kcalPer100g: raw.kcalPer100g,
      proteinPer100g: raw.proteinPer100g,
      fatPer100g: raw.fatPer100g,
      carbsPer100g: raw.carbsPer100g,
      fiberPer100g: raw.fiberPer100g ?? undefined,
      saltPer100g: raw.saltPer100g ?? undefined,
      ingredients: raw.ingredients || undefined,
      notes: raw.notes || undefined,
    };

    this.saving.set(true);
    this.submitError.set(null);

    try {
      if (this.isEditMode() && this.referenceId) {
        await this.productsService.updateReference(this.referenceId, payload);
      } else {
        await this.productsService.createReference({
          productId,
          ...payload,
        });
      }

      await this.router.navigate(['/products', productId]);
    } catch {
      this.submitError.set('Enregistrement impossible. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  private async load(productId: string | null, refId: string | null): Promise<void> {
    this.productId.set(productId);
    this.loadError.set(null);
    this.submitError.set(null);

    if (!productId) {
      this.loadError.set('Produit introuvable.');
      return;
    }

    const product = await this.productsService.getProduct(productId);
    if (!product) {
      this.loadError.set('Produit introuvable.');
      return;
    }

    if (!refId) {
      this.isEditMode.set(false);
      this.referenceId = null;
      this.form.reset({
        store: '',
        label: '',
        brand: '',
        barcode: '',
        kcalPer100g: 0,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
        fiberPer100g: null,
        saltPer100g: null,
        ingredients: '',
        notes: '',
      });
      return;
    }

    this.isEditMode.set(true);
    this.referenceId = refId;

    const reference = await this.productsService.getReference(refId);
    if (!reference || reference.productId !== productId) {
      this.loadError.set('Référence introuvable.');
      return;
    }

    this.form.patchValue({
      store: reference.store,
      label: reference.label,
      brand: reference.brand ?? '',
      barcode: reference.barcode ?? '',
      kcalPer100g: reference.kcalPer100g,
      proteinPer100g: reference.proteinPer100g,
      fatPer100g: reference.fatPer100g,
      carbsPer100g: reference.carbsPer100g,
      fiberPer100g: reference.fiberPer100g ?? null,
      saltPer100g: reference.saltPer100g ?? null,
      ingredients: reference.ingredients ?? '',
      notes: reference.notes ?? '',
    });
  }
}
