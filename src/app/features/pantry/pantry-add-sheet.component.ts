import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { PantryItemWithProduct } from '../../core/models/pantry-item';
import { PantryService } from './pantry.service';

@Component({
  selector: 'app-pantry-add-sheet',
  imports: [ReactiveFormsModule],
  templateUrl: './pantry-add-sheet.component.html',
  styleUrl: './pantry-add-sheet.component.scss',
})
export class PantryAddSheetComponent {
  protected readonly pantry = inject(PantryService);
  private readonly fb = inject(FormBuilder);

  readonly item = input<PantryItemWithProduct | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    productId: [''],
    newProductName: [''],
    quantityG: [100, [Validators.required, Validators.min(1)]],
    expiryDate: [''],
    location: [''],
  });

  readonly isEditMode = signal(false);
  readonly hasProducts = signal(false);

  constructor() {
    effect(() => {
      const editing = this.item();
      const products = this.pantry.products();
      this.hasProducts.set(products.length > 0);
      this.isEditMode.set(editing != null);

      if (editing) {
        this.form.patchValue({
          productId: editing.productId,
          quantityG: editing.quantityG,
          expiryDate: editing.expiryDate ?? '',
          location: editing.location ?? '',
        });
        this.form.controls.productId.disable();
        this.form.controls.newProductName.disable();
      } else {
        this.form.controls.productId.enable();
        this.form.controls.newProductName.enable();
        this.form.patchValue({
          productId: products[0]?.id ?? '',
          newProductName: '',
          quantityG: 100,
          expiryDate: '',
          location: '',
        });
      }
    });
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
        let productId = raw.productId;

        if (!this.hasProducts()) {
          const created = await this.pantry.createProduct(raw.newProductName);
          productId = created.id;
        } else if (!productId) {
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
