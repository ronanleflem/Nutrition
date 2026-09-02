import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import type { UsdaFoodCacheEntry } from '../models/usda-food-cache';

@Injectable({ providedIn: 'root' })
export class UsdaFoodCacheService {
  private readonly database = inject(DatabaseService);

  async put(entry: UsdaFoodCacheEntry): Promise<void> {
    await this.database.putUsdaFoodCacheEntry(entry);
  }

  async get(fdcId: number): Promise<UsdaFoodCacheEntry | undefined> {
    return this.database.getUsdaFoodCacheEntry(fdcId);
  }
}
