import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  PRODUCT_PRIORITY_LABELS,
  PRODUCT_PRIORITY_VISIBLE_LABELS,
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
    it(`renders visible label ${PRODUCT_PRIORITY_VISIBLE_LABELS[priority]} for ${priority}`, () => {
      fixture.componentRef.setInput('priority', priority);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(PRODUCT_PRIORITY_VISIBLE_LABELS[priority]);
      expect(fixture.debugElement.query(By.css('.priority-badge__sr-only')).nativeElement.textContent).toBe(
        PRODUCT_PRIORITY_LABELS[priority],
      );
    });
  }

  it('renders nothing when priority is undefined', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.priority-badge'))).toBeNull();
  });
});
