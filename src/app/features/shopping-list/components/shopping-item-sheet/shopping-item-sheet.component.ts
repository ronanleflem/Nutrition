import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { ShoppingListItemWithProduct } from '../../../../core/models/shopping-list-item';
import { ShoppingListService } from '../../services/shopping-list.service';

@Component({
  selector: 'app-shopping-item-sheet',
  imports: [ReactiveFormsModule],
  templateUrl: './shopping-item-sheet.component.html',
  styleUrl: './shopping-item-sheet.component.scss',
})
export class ShoppingItemSheetComponent {
  protected readonly shopping = inject(ShoppingListService);
  private readonly fb = inject(FormBuilder);

  readonly item = input<ShoppingListItemWithProduct | null>(null);
  readonly prefillProductId = input<string | null>(null);
  readonly prefillProductName = input<string | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly hasProducts = signal(false);

  readonly form = this.fb.nonNullable.group({
    productId: [''],
    newProductName: [''],
    quantityG: [100, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      const editing = this.item();
      const products = this.shopping.products();
      const prefillId = this.prefillProductId();
      this.hasProducts.set(products.length > 0);
      this.isEditMode.set(editing != null);

      if (editing) {
        this.form.patchValue({
          productId: editing.productId,
          quantityG: editing.quantityG,
        });
        this.form.controls.productId.disable();
        this.form.controls.newProductName.disable();
      } else if (prefillId) {
        this.form.controls.productId.disable();
        this.form.controls.newProductName.disable();
        this.form.patchValue({
          productId: prefillId,
          newProductName: '',
          quantityG: 100,
        });
      } else {
        this.form.controls.productId.enable();
        this.form.controls.newProductName.enable();
        this.form.patchValue({
          productId: products[0]?.id ?? '',
          newProductName: '',
          quantityG: 100,
        });
      }
    });
  }

  isPrefill(): boolean {
    return !this.isEditMode() && !!this.prefillProductId();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === 'true') {
      this.closed.emit();
    }
  }

  async submit(): Promise<void> {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.quantityG.invalid) {
        this.errorMessage.set('La quantité doit être supérieure à 0 g.');
      }
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

        await this.shopping.updateItemQuantity(editing.id, raw.quantityG);
      } else {
        let productId = this.prefillProductId() ?? raw.productId;

        if (!this.isPrefill() && !this.hasProducts()) {
          const name = raw.newProductName.trim();
          if (!name) {
            this.errorMessage.set('Saisissez un nom de produit.');
            return;
          }
          const created = await this.shopping.createProduct(name);
          productId = created.id;
        } else if (!productId) {
          this.errorMessage.set('Choisissez un produit.');
          return;
        }

        await this.shopping.addManualItem(productId, raw.quantityG);
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
      await this.shopping.deleteItem(editing.id);
      this.saved.emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de supprimer.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
