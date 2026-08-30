import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  PRODUCT_PRIORITY_LABELS,
  type ProductPriority,
} from '../../../../core/models/product';
import { PriorityBadgeComponent } from './priority-badge.component';

describe('PriorityBadgeComponent', () => {
  let fixture: ComponentFixture<PriorityBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriorityBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PriorityBadgeComponent);
  });

  for (const priority of ['green', 'yellow', 'gray'] as ProductPriority[]) {
    it(`renders French aria-label for ${priority} priority`, () => {
      fixture.componentRef.setInput('priority', priority);
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('.priority-badge'));
      expect(badge.attributes['aria-label']).toBe(PRODUCT_PRIORITY_LABELS[priority]);
    });
  }

  it('renders nothing when priority is undefined', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.priority-badge'))).toBeNull();
  });
});
