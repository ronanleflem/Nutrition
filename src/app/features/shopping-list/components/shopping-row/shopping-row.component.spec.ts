/**
 * @vitest-environment jsdom
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { ShoppingListItemWithProduct } from '../../../../core/models/shopping-list-item';
import { ShoppingRowComponent } from './shopping-row.component';

@Component({
  standalone: true,
  imports: [ShoppingRowComponent],
  template: `<app-shopping-row [item]="item" [storeMode]="true" />`,
})
class ShoppingRowHostComponent {
  readonly item: ShoppingListItemWithProduct = {
    id: 'item-1',
    productId: 'product-1',
    productName: 'Avoine',
    quantityG: 500,
    checked: true,
    source: 'auto',
    recommendedStores: ['auchan'],
    createdAt: '2026-09-03T00:00:00.000Z',
  };
}

describe('ShoppingRowComponent', () => {
  it('exposes aria-checked and keeps checked text in primary ink', async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingRowHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShoppingRowHostComponent);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.shopping-row') as HTMLElement;
    expect(row.getAttribute('aria-checked')).toBe('true');
    expect(row.classList.contains('shopping-row--checked')).toBe(true);

    const name = fixture.nativeElement.querySelector('.shopping-row__name') as HTMLElement;
    expect(name.textContent?.trim()).toBe('Avoine');
  });
});
