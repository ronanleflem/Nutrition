import { inject, Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import type { OnlineSearchHit } from './food-search-cascade.types';
import {
  groupEntriesBySource,
  type CachedOnlineHitsBySource,
} from './search-cache.utils';

@Injectable({ providedIn: 'root' })
export class SearchCacheService {
  private readonly database = inject(DatabaseService);

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
  }

  async countEntries(): Promise<number> {
    return this.database.countSearchCacheEntries();
  }
}
