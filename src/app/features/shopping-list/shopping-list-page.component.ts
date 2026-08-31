import { Component, inject, OnInit } from '@angular/core';

import { EmptyStateComponent } from '../products/components/empty-state/empty-state.component';
import { ShoppingRowComponent } from './components/shopping-row/shopping-row.component';
import { ShoppingListService } from './services/shopping-list.service';

@Component({
  selector: 'app-shopping-list-page',
  imports: [EmptyStateComponent, ShoppingRowComponent],
  templateUrl: './shopping-list-page.component.html',
  styleUrl: './shopping-list-page.component.scss',
})
export class ShoppingListPageComponent implements OnInit {
  protected readonly shopping = inject(ShoppingListService);

  ngOnInit(): void {
    void this.shopping.refresh();
  }

  onGenerate(): void {
    void this.shopping.generateFromCurrentWeek();
  }
}
