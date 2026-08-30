import { vi } from 'vitest';

import { OffApiService } from './off-api.service';

describe('OffApiService', () => {
  let service: OffApiService;

  beforeEach(() => {
    service = new OffApiService();
  });

  afterEach(() => {
    service.clearSessionCache();
    vi.restoreAllMocks();
  });

  it('maps a found OFF product to prefill data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        code: '3017620422003',
        product: {
          product_name_fr: 'Nutella',
          brands: 'Ferrero',
          ingredients_text_fr: 'Sucre, huile de palme',
          nutriments: {
            'energy-kcal_100g': 539,
            proteins_100g: 6.3,
            fat_100g: 30.9,
            carbohydrates_100g: 57.5,
            fiber_100g: 0,
            salt_100g: 0.107,
          },
        },
      }),
    } as Response);

    const result = await service.lookupProduct('3017620422003');

    expect(result).toEqual({
      status: 'found',
      prefill: {
        barcode: '3017620422003',
        label: 'Nutella',
        brand: 'Ferrero',
        suggestedProductName: 'Nutella',
        kcalPer100g: 539,
        proteinPer100g: 6.3,
        fatPer100g: 30.9,
        carbsPer100g: 57.5,
        fiberPer100g: 0,
        saltPer100g: 0.107,
        ingredients: 'Sucre, huile de palme',
      },
    });
  });

  it('returns not_found when OFF status is not 1', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0, code: '0000000000000' }),
    } as Response);

    const result = await service.lookupProduct('0000000000000');

    expect(result).toEqual({ status: 'not_found', barcode: '0000000000000' });
  });

  it('returns network_error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    const result = await service.lookupProduct('3017620422003');

    expect(result).toEqual({ status: 'network_error', barcode: '3017620422003' });
  });

  it('uses session cache for repeated lookups', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0, code: '3017620422003' }),
    } as Response);

    await service.lookupProduct('3017620422003');
    await service.lookupProduct('3017620422003');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('converts energy in kilojoules to kcal when kcal is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        code: '3017620422003',
        product: {
          product_name: 'Test',
          nutriments: {
            energy_100g: 2252,
            proteins_100g: 6.3,
            fat_100g: 30.9,
            carbohydrates_100g: 57.5,
          },
        },
      }),
    } as Response);

    const result = await service.lookupProduct('3017620422003');

    expect(result.status).toBe('found');
    if (result.status === 'found') {
      expect(result.prefill.kcalPer100g).toBe(538.2);
    }
  });

  it('does not cache network_error responses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await service.lookupProduct('3017620422003');
    await service.lookupProduct('3017620422003');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
