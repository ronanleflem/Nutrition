import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../../core/database/database.service';
import { deleteNutritionDatabase } from '../../core/database/nutrition-database.testing';
import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();

    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();
  });

  afterEach(async () => {
    fixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  async function mount(): Promise<void> {
    fixture = TestBed.createComponent(SettingsPageComponent);
    fixture.detectChanges();
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (checkbox() && fixture.componentInstance.homePreferenceReady()) {
        return;
      }
    }
  }

  function checkbox(): HTMLInputElement {
    return fixture.nativeElement.querySelector(
      '.settings-page__field--checkbox input[type="checkbox"]',
    ) as HTMLInputElement;
  }

  it('renders the hide-home toggle unchecked by default', async () => {
    await mount();

    expect(fixture.nativeElement.textContent).toContain("Masquer l'accueil au démarrage");
    expect(checkbox().checked).toBe(false);
  });

  it('persists hideHomeOnStartup when the toggle is checked', async () => {
    await mount();

    checkbox().checked = true;
    checkbox().dispatchEvent(new Event('change'));
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      if (fixture.componentInstance.homePreferenceMessage()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect((await database.getAppSettings()).hideHomeOnStartup).toBe(true);
    expect(checkbox().checked).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Préférence enregistrée.');
  });

  it('renders the hide-home toggle checked when the preference is already stored', async () => {
    await database.updateHideHomeOnStartup(true);
    await mount();

    expect(checkbox().checked).toBe(true);

    checkbox().checked = false;
    checkbox().dispatchEvent(new Event('change'));
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      if (fixture.componentInstance.homePreferenceMessage()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect((await database.getAppSettings()).hideHomeOnStartup).toBeUndefined();
    expect(checkbox().checked).toBe(false);
  });

  it('shows a French error when saving the hide-home toggle fails', async () => {
    await mount();
    vi.spyOn(database, 'updateHideHomeOnStartup').mockRejectedValue(new Error('fail'));

    checkbox().checked = true;
    checkbox().dispatchEvent(new Event('change'));
    for (let attempt = 0; attempt < 50; attempt++) {
      fixture.detectChanges();
      if (fixture.componentInstance.homePreferenceError()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect(fixture.nativeElement.textContent).toContain('Enregistrement impossible. Réessayez.');
    expect(checkbox().checked).toBe(false);
  });
});
