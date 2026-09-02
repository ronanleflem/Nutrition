import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeDashboardService } from './home-dashboard.service';
import type { HomeDashboardSnapshot } from './home-dashboard.types';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private readonly dashboard = inject(HomeDashboardService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly snapshot = signal<HomeDashboardSnapshot | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  remainingShoppingLabel(count: number): string {
    return count <= 1 ? `${count} article restant` : `${count} articles restants`;
  }

  expiringCountLabel(count: number): string {
    return count <= 1 ? `${count} produit` : `${count} produits`;
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      this.snapshot.set(await this.dashboard.loadDashboard());
    } catch {
      this.loadError.set('Chargement de l’accueil impossible. Réessayez.');
    } finally {
      this.loading.set(false);
    }
  }
}
