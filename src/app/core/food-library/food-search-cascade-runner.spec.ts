import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database/database.service';
import { NetworkStatusService } from '../network/network-status.service';
import { FoodSearchService } from './food-search.service';
import { resolveIncludeOnline, runFoodSearchCascade } from './food-search-cascade-runner';

describe('food-search-cascade-runner', () => {
  let database: DatabaseService;
  let foodSearch: FoodSearchService;
  let onlineSignal = signal(true);

  beforeEach(() => {
    onlineSignal = signal(true);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NetworkStatusService,
          useValue: { isOnline: onlineSignal.asReadonly() },
        },
      ],
    });
    database = TestBed.inject(DatabaseService);
    foodSearch = TestBed.inject(FoodSearchService);
  });

  it('resolveIncludeOnline skips online when offline', async () => {
    onlineSignal.set(false);

    const resolved = await resolveIncludeOnline(
      database,
      TestBed.inject(NetworkStatusService),
      'skyr danone',
      false,
    );

    expect(resolved.includeOnline).toBe(false);
    expect(resolved.canSearchOnline).toBe(false);
  });

  it('resolveIncludeOnline waits for manual trigger when preference is set', async () => {
    await database.updatePreferManualOnlineSearch(true);

    const withoutForce = await resolveIncludeOnline(
      database,
      TestBed.inject(NetworkStatusService),
      'skyr danone',
      false,
    );
    const withForce = await resolveIncludeOnline(
      database,
      TestBed.inject(NetworkStatusService),
      'skyr danone',
      true,
    );

    expect(withoutForce.includeOnline).toBe(false);
    expect(withForce.includeOnline).toBe(true);
  });

  it('runFoodSearchCascade reports onlinePending in manual mode', async () => {
    await database.updatePreferManualOnlineSearch(true);
    vi.spyOn(foodSearch, 'searchCascade').mockResolvedValue({
      sections: [],
      durationMs: 1,
      onlineSearched: false,
    });

    const outcome = await runFoodSearchCascade(
      foodSearch,
      database,
      TestBed.inject(NetworkStatusService),
      { query: 'skyr danone' },
    );

    expect(outcome.onlinePending).toBe(true);
    expect(outcome.result.onlineSearched).toBe(false);
    expect(foodSearch.searchCascade).toHaveBeenCalledWith('skyr danone', {
      catalog: undefined,
      limitPerSection: undefined,
      includeOnline: false,
    });
  });
});
