import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { OFF_API_ORIGIN, OFF_API_URL_PATTERN } from './off-api-origin';
import { OFF_SEARCH_ORIGIN, OFF_SEARCH_URL_PATTERN } from '../off-api/off-search-origin';
import {
  FOODREPO_API_ORIGIN,
  FOODREPO_API_URL_PATTERN,
} from '../foodrepo-api/foodrepo-search-origin';
import {
  USDA_FDC_API_ORIGIN,
  USDA_FDC_API_URL_PATTERN,
} from '../usda-fdc/usda-fdc-origin';

describe('ngsw-config.json', () => {
  const configPath = resolve(process.cwd(), 'ngsw-config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8')) as {
    index: string;
    navigationRequestStrategy: string;
    assetGroups: Array<{
      name: string;
      installMode: string;
      resources: { files: string[] };
    }>;
    dataGroups: Array<{
      name: string;
      urls: string[];
      cacheConfig: { maxSize: number; maxAge: string; strategy: string };
    }>;
  };

  it('prefetches the app shell and lazy route chunks', () => {
    const shellGroup = config.assetGroups.find((group) => group.name === 'app-shell');
    expect(shellGroup?.installMode).toBe('prefetch');
    expect(shellGroup?.resources.files).toEqual(
      expect.arrayContaining(['/index.html', '/*.js', '/*.css', '/manifest.webmanifest']),
    );
  });

  it('prefetches PWA icons for offline install', () => {
    const iconGroup = config.assetGroups.find((group) => group.name === 'pwa-icons');
    expect(iconGroup?.installMode).toBe('prefetch');
    expect(iconGroup?.resources.files).toContain('/icons/**');
  });

  it('lazy-loads offline food library chunks', () => {
    const foodLibraryGroup = config.assetGroups.find((group) => group.name === 'food-library');
    expect(foodLibraryGroup?.installMode).toBe('lazy');
    expect(foodLibraryGroup?.resources.files).toContain('/assets/food-library/**');
  });

  it('uses freshness for navigation requests to support offline shell routing', () => {
    expect(config.navigationRequestStrategy).toBe('freshness');
    expect(config.index).toBe('/index.html');
  });

  it('does not persist Open Food Facts API responses in the service worker', () => {
    const offGroup = config.dataGroups.find((group) => group.name === 'open-food-facts-no-cache');
    expect(offGroup?.urls).toContain(OFF_API_URL_PATTERN);
    expect(offGroup?.urls[0]).toContain(OFF_API_ORIGIN);
    expect(offGroup?.cacheConfig.maxSize).toBe(0);
    expect(offGroup?.cacheConfig.maxAge).toBe('0u');
  });

  it('does not persist Open Food Facts Search-a-licious responses in the service worker', () => {
    const searchGroup = config.dataGroups.find(
      (group) => group.name === 'open-food-facts-search-no-cache',
    );
    expect(searchGroup?.urls).toContain(OFF_SEARCH_URL_PATTERN);
    expect(searchGroup?.urls[0]).toContain(OFF_SEARCH_ORIGIN);
    expect(searchGroup?.cacheConfig.maxSize).toBe(0);
    expect(searchGroup?.cacheConfig.maxAge).toBe('0u');
  });

  it('does not persist FoodRepo API responses in the service worker', () => {
    const foodRepoGroup = config.dataGroups.find((group) => group.name === 'foodrepo-api-no-cache');
    expect(foodRepoGroup?.urls).toContain(FOODREPO_API_URL_PATTERN);
    expect(foodRepoGroup?.urls[0]).toContain(FOODREPO_API_ORIGIN);
    expect(foodRepoGroup?.cacheConfig.maxSize).toBe(0);
    expect(foodRepoGroup?.cacheConfig.maxAge).toBe('0u');
  });

  it('does not persist USDA FDC API responses in the service worker', () => {
    const usdaGroup = config.dataGroups.find((group) => group.name === 'usda-fdc-api-no-cache');
    expect(usdaGroup?.urls).toContain(USDA_FDC_API_URL_PATTERN);
    expect(usdaGroup?.urls[0]).toContain(USDA_FDC_API_ORIGIN);
    expect(usdaGroup?.cacheConfig.maxSize).toBe(0);
    expect(usdaGroup?.cacheConfig.maxAge).toBe('0u');
  });
});

describe('production ngsw.json output', () => {
  const ngswPath = resolve(process.cwd(), 'dist/nutrition/browser/ngsw.json');

  it('lists lazy route chunks in the prefetched shell group', () => {
    expect(
      existsSync(ngswPath),
      'dist/nutrition/browser/ngsw.json missing — run npm run build before npm test',
    ).toBe(true);

    const ngsw = JSON.parse(readFileSync(ngswPath, 'utf-8')) as {
      assetGroups: Array<{ name: string; urls: string[] }>;
    };

    const shellGroup = ngsw.assetGroups.find((group) => group.name === 'app-shell');
    const chunkUrls = shellGroup?.urls.filter((url) => url.startsWith('/chunk-')) ?? [];

    expect(chunkUrls.length).toBeGreaterThanOrEqual(7);
    expect(shellGroup?.urls).toEqual(
      expect.arrayContaining(['/index.html', '/manifest.webmanifest']),
    );
  });
});
