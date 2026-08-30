import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { ProductPriority } from '../../../../core/models/product';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form-page.component.html',
  styleUrl: './product-form-page.component.scss',
})
export class ProductFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);

  readonly isEditMode = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);

  private productId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    category: [''],
    priority: ['' as '' | ProductPriority],
    notes: [''],
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.isEditMode.set(false);
        this.productId = null;
        this.form.reset({
          name: '',
          category: '',
          priority: '',
          notes: '',
        });
        return;
      }

      void this.loadProduct(id);
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, category, priority, notes } = this.form.getRawValue();
    const payload = {
      name,
      category: category || undefined,
      priority: priority || undefined,
      notes: notes || undefined,
    };

    this.saving.set(true);
    this.submitError.set(null);

    try {
      if (this.isEditMode() && this.productId) {
        await this.productsService.updateProduct(this.productId, {
          ...payload,
          priority: priority || null,
        });
        await this.router.navigate(['/products', this.productId]);
      } else {
        const product = await this.productsService.createProduct(payload);
        await this.router.navigate(['/products', product.id]);
      }
    } catch {
      this.submitError.set('Enregistrement impossible. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadProduct(id: string): Promise<void> {
    this.isEditMode.set(true);
    this.productId = id;
    this.loadError.set(null);
    this.submitError.set(null);

    const product = await this.productsService.getProduct(id);
    if (!product) {
      this.loadError.set('Produit introuvable.');
      return;
    }

    this.form.patchValue({
      name: product.name,
      category: product.category ?? '',
      priority: product.priority ?? '',
      notes: product.notes ?? '',
    });
  }
}
