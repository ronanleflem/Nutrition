import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import Dexie from 'dexie';

import { MACRO_GOALS_SINGLETON_ID } from '../models/macro-goals';
import { NUTRITION_DB_NAME, NutritionDatabase } from './nutrition-database';
import { deleteNutritionDatabase } from './nutrition-database.testing';
import { DatabaseService } from './database.service';

describe('DatabaseService macro goals', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseService);
  });

  afterEach(async () => {
    await service.closeForTests();
    await deleteNutritionDatabase();
  });

  it('seeds an empty macroGoals singleton on first load', async () => {
    const goals = await service.getMacroGoals();

    expect(goals).toEqual({
      id: MACRO_GOALS_SINGLETON_ID,
    });
  });

  it('persists partial macro goals', async () => {
    const saved = await service.updateMacroGoals({
      kcal: 2000,
      proteinG: 120,
      fatG: null,
      carbsG: null,
      fiberG: null,
    });

    expect(saved).toEqual({
      id: MACRO_GOALS_SINGLETON_ID,
      kcal: 2000,
      proteinG: 120,
    });

    const reloaded = await service.getMacroGoals();
    expect(reloaded).toEqual(saved);
  });

  it('clears a field when null is provided', async () => {
    await service.updateMacroGoals({
      kcal: 2000,
      proteinG: 120,
      fatG: 70,
      carbsG: 200,
      fiberG: 30,
    });

    const saved = await service.updateMacroGoals({
      proteinG: null,
    });

    expect(saved).toEqual({
      id: MACRO_GOALS_SINGLETON_ID,
      kcal: 2000,
      fatG: 70,
      carbsG: 200,
      fiberG: 30,
    });
  });

  it('reseeds macroGoals when singleton is missing after initialization', async () => {
    await service.initialize();
    const db = new NutritionDatabase();
    await db.open();
    await db.macroGoals.clear();
    await db.close();

    const goals = await service.getMacroGoals();

    expect(goals.id).toBe(MACRO_GOALS_SINGLETON_ID);
    expect(goals.kcal).toBeUndefined();
  });

  it('rejects negative macro goal values', async () => {
    await service.updateMacroGoals({ kcal: 2000, proteinG: 120 });

    await expect(service.updateMacroGoals({ proteinG: -5 })).rejects.toThrow(
      'Les objectifs macros doivent être positifs ou nuls.',
    );

    const goals = await service.getMacroGoals();
    expect(goals.proteinG).toBe(120);
  });

  it('persists macroGoals across service re-instantiation', async () => {
    await service.updateMacroGoals({ kcal: 1800, proteinG: 100 });
    await service.closeForTests();

    const reloaded = TestBed.inject(DatabaseService);
    const goals = await reloaded.getMacroGoals();

    expect(goals).toEqual({
      id: MACRO_GOALS_SINGLETON_ID,
      kcal: 1800,
      proteinG: 100,
    });
  });
});
