import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import { IngredientProductPickerSheetComponent } from '../recipes/components/ingredient-product-picker-sheet/ingredient-product-picker-sheet.component';
import { ProductsService } from '../products/services/products.service';
import { PantryService } from './pantry.service';

@Component({
  selector: 'app-pantry-add-sheet',
  imports: [ReactiveFormsModule, IngredientProductPickerSheetComponent],
  templateUrl: './pantry-add-sheet.component.html',
  styleUrl: './pantry-add-sheet.component.scss',
})
export class PantryAddSheetComponent implements OnInit {
  protected readonly pantry = inject(PantryService);
  private readonly productsService = inject(ProductsService);
  private readonly fb = inject(FormBuilder);

  readonly item = input<PantryItemWithProduct | null>(null);
  readonly prefillProductId = input<string | null>(null);
  readonly prefillProductName = input<string | null>(null);
  readonly prefillQuantityG = input<number | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly pickerOpen = signal(false);
  readonly selectedProductId = signal<string | null>(null);
  readonly selectedProductName = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    quantityG: [100, [Validators.required, Validators.min(1)]],
    expiryDate: [''],
    location: [''],
  });

  readonly isEditMode = signal(false);
  readonly catalog = this.productsService.catalog;

  constructor() {
    effect(() => {
      const editing = this.item();
      const prefillId = this.prefillProductId();
      const prefillName = this.prefillProductName();
      this.isEditMode.set(editing != null);

      if (editing) {
        this.form.patchValue({
          quantityG: editing.quantityG,
          expiryDate: editing.expiryDate ?? '',
          location: editing.location ?? '',
        });
      } else {
        const prefillQty = this.prefillQuantityG();
        this.form.patchValue({
          quantityG: prefillQty && prefillQty > 0 ? prefillQty : 100,
          expiryDate: '',
          location: '',
        });
        if (prefillId) {
          this.selectedProductId.set(prefillId);
          this.selectedProductName.set(prefillName ?? 'Produit sélectionné');
        } else {
          this.selectedProductId.set(null);
          this.selectedProductName.set(null);
        }
      }
    });
  }

  isPrefill(): boolean {
    return !this.isEditMode() && !!this.prefillProductId();
  }

  ngOnInit(): void {
    if (this.isPrefill()) {
      return;
    }

    void this.productsService.loadCatalog();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  openProductPicker(): void {
    this.pickerOpen.set(true);
  }

  closeProductPicker(): void {
    this.pickerOpen.set(false);
  }

  onProductSelected(productId: string): void {
    const item = this.catalog().find((entry) => entry.product.id === productId);
    this.selectedProductId.set(productId);
    this.selectedProductName.set(item?.product.name ?? 'Produit sélectionné');
    this.pickerOpen.set(false);
  }

  async submit(): Promise<void> {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.submitting.set(true);

    try {
      if (this.isEditMode()) {
        const editing = this.item();
        if (!editing) {
          return;
        }

        await this.pantry.updateItem(editing.id, {
          quantityG: raw.quantityG,
          expiryDate: raw.expiryDate || null,
          location: raw.location || null,
        });
      } else {
        const productId = this.selectedProductId();
        if (!productId) {
          this.errorMessage.set('Choisissez un produit.');
          return;
        }

        await this.pantry.addItem({
          productId,
          quantityG: raw.quantityG,
          expiryDate: raw.expiryDate || undefined,
          location: raw.location || undefined,
        });
      }

      this.saved.emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de sauvegarder.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteItem(): Promise<void> {
    const editing = this.item();
    if (!editing) {
      return;
    }

    this.submitting.set(true);
    try {
      await this.pantry.deleteItem(editing.id);
      this.saved.emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
