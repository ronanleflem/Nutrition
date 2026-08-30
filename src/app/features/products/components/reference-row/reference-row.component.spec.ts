import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { ProductReference } from '../../../../core/models/product-reference';
import { ReferenceRowComponent } from './reference-row.component';

describe('ReferenceRowComponent', () => {
  let fixture: ComponentFixture<ReferenceRowComponent>;

  const reference: ProductReference = {
    id: 'ref-1',
    productId: 'product-1',
    store: 'auchan',
    label: 'Skyr Auchan',
    kcalPer100g: 57,
    proteinPer100g: 10,
    fatPer100g: 0,
    carbsPer100g: 4,
    nutritionalScore: 80,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferenceRowComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ReferenceRowComponent);
    fixture.componentRef.setInput('reference', reference);
    fixture.componentRef.setInput('productId', 'product-1');
  });

  it('shows archived badge when product is archived', () => {
    fixture.componentRef.setInput('productArchived', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Archivé');
  });
});
