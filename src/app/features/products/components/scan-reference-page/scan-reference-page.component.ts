import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import type { Store } from '../../../../core/models/store';
import { STORES, STORE_LABELS } from '../../../../core/models/store';
import type { Product } from '../../../../core/models/product';
import type { ScanFlowState } from '../../models/scan-flow-state';
import { ProductsService } from '../../services/products.service';
import { ScanService } from '../../services/scan.service';

@Component({
  selector: 'app-scan-reference-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './scan-reference-page.component.html',
  styleUrl: './scan-reference-page.component.scss',
})
export class ScanReferencePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly scanService = inject(ScanService);

  readonly stores = STORES;
  readonly storeLabels = STORE_LABELS;
  readonly flowState = signal<ScanFlowState | null>(null);
  readonly products = signal<Product[]>([]);
  readonly saving = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly productMode = signal<'existing' | 'new'>('new');

  readonly form = this.fb.nonNullable.group({
    productId: [''],
    newProductName: ['', [Validators.required, Validators.pattern(/\S/)]],
    store: ['' as '' | Store, Validators.required],
    label: ['', [Validators.required, Validators.pattern(/\S/)]],
    brand: [''],
    barcode: [''],
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
    void this.initialize();
  }

  ngOnDestroy(): void {
    this.scanService.clearFlowState();
  }

  setProductMode(mode: 'existing' | 'new'): void {
    this.productMode.set(mode);
    this.syncProductModeValidators();
  }

  statusMessage(): string | null {
    const state = this.flowState();
    if (!state) {
      return null;
    }

    if (state.status === 'off-unknown') {
      return 'Produit inconnu — complétez le formulaire manuellement.';
    }

    if (state.status === 'offline') {
      return 'Pas de connexion — saisissez le produit manuellement.';
    }

    if (state.status === 'offline-library-found') {
      return 'Produit trouvé dans la bibliothèque offline — vérifiez et enregistrez.';
    }

    if (state.status === 'network-error') {
      return 'Open Food Facts indisponible — saisissez le produit manuellement.';
    }

    return null;
  }

  async onSubmit(): Promise<void> {
    const state = this.flowState();
    if (!state || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (this.productMode() === 'existing' && !raw.productId) {
      this.form.controls.productId.markAsTouched();
      return;
    }

    this.saving.set(true);
    this.submitError.set(null);

    try {
      let productId = raw.productId;
      if (this.productMode() === 'new') {
        const product = await this.productsService.createProduct({
          name: raw.newProductName.trim(),
        });
        productId = product.id;
      }

      if (!productId) {
        return;
      }

      await this.productsService.createReference({
        productId,
        store: raw.store as Store,
        label: raw.label,
        brand: raw.brand || undefined,
        barcode: raw.barcode || state.barcode || undefined,
        kcalPer100g: raw.kcalPer100g,
        proteinPer100g: raw.proteinPer100g,
        fatPer100g: raw.fatPer100g,
        carbsPer100g: raw.carbsPer100g,
        fiberPer100g: raw.fiberPer100g ?? undefined,
        saltPer100g: raw.saltPer100g ?? undefined,
        ingredients: raw.ingredients || undefined,
        notes: raw.notes || undefined,
      });

      this.scanService.clearFlowState();
      await this.router.navigate(['/products', productId]);
    } catch {
      this.submitError.set('Création impossible. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  private async initialize(): Promise<void> {
    const state = this.scanService.flowState();
    if (!state) {
      await this.router.navigate(['/products', 'scan']);
      return;
    }

    this.flowState.set(state);
    this.applyPrefill(state);
    await this.loadProducts(state);
  }

  private applyPrefill(state: ScanFlowState): void {
    this.form.patchValue({
      barcode: state.barcode,
      label: state.prefill?.label ?? '',
      brand: state.prefill?.brand ?? '',
      newProductName: state.prefill?.suggestedProductName ?? '',
      kcalPer100g: state.prefill?.kcalPer100g ?? 0,
      proteinPer100g: state.prefill?.proteinPer100g ?? 0,
      fatPer100g: state.prefill?.fatPer100g ?? 0,
      carbsPer100g: state.prefill?.carbsPer100g ?? 0,
      fiberPer100g: state.prefill?.fiberPer100g ?? null,
      saltPer100g: state.prefill?.saltPer100g ?? null,
      ingredients: state.prefill?.ingredients ?? '',
    });
  }

  private async loadProducts(state: ScanFlowState): Promise<void> {
    await this.productsService.loadCatalog();
    const products = this.productsService.catalog().map((item) => item.product);
    this.products.set(products);

    if (products.length > 0) {
      this.productMode.set('existing');
      const suggestedMatch = state.prefill?.suggestedProductName
        ? products.find((product) =>
            product.name.localeCompare(state.prefill!.suggestedProductName!, 'fr', {
              sensitivity: 'base',
            }) === 0,
          )
        : undefined;

      this.form.patchValue({ productId: (suggestedMatch ?? products[0]).id });
      this.syncProductModeValidators();
      return;
    }

    this.productMode.set('new');
    this.syncProductModeValidators();
    if (!this.form.controls.newProductName.value && state.prefill?.suggestedProductName) {
      this.form.patchValue({ newProductName: state.prefill.suggestedProductName });
    }
  }

  private syncProductModeValidators(): void {
    const newProductName = this.form.controls.newProductName;

    if (this.productMode() === 'existing') {
      newProductName.clearValidators();
    } else {
      newProductName.setValidators([Validators.required, Validators.pattern(/\S/)]);
    }

    newProductName.updateValueAndValidity();
  }
}
