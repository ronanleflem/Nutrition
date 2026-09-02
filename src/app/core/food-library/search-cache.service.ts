import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { FoodRepoSearchProvider } from '../foodrepo-api/foodrepo-search.provider';
import { OffSearchProvider } from '../off-api/off-search.provider';
import { UsdaFdcSearchProvider } from '../usda-fdc/usda-search.provider';
import type { OnlineSearchHit } from './food-search-cascade.types';
import { clearAllOnlineSearchSessionCaches } from './online-search-provider-utils';
import {
  groupEntriesBySource,
  type CachedOnlineHitsBySource,
} from './search-cache.utils';

@Injectable({ providedIn: 'root' })
export class SearchCacheService {
  private readonly database = inject(DatabaseService);
  private readonly offSearch = inject(OffSearchProvider);
  private readonly foodRepoSearch = inject(FoodRepoSearchProvider);
  private readonly usdaSearch = inject(UsdaFdcSearchProvider);

  async findMatchingHits(query: string, limitPerSection = 25): Promise<CachedOnlineHitsBySource> {
    const entries = await this.database.findSearchCacheEntries(query);
    return groupEntriesBySource(entries, limitPerSection);
  }

  async rememberSuccessfulHits(query: string, hits: OnlineSearchHit[]): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed || hits.length === 0) {
      return;
    }

    await this.database.rememberSearchCacheHits(trimmed, hits);
  }

  async clearHistory(): Promise<void> {
    await this.database.clearSearchCache();
    clearAllOnlineSearchSessionCaches(this.offSearch, this.foodRepoSearch, this.usdaSearch);
  }

  async countEntries(): Promise<number> {
    return this.database.countSearchCacheEntries();
  }
}
