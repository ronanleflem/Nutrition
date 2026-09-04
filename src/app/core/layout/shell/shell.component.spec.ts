import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import Dexie from 'dexie';

import { DatabaseService } from '../../database/database.service';
import { NUTRITION_DB_NAME, NutritionDatabase } from '../../database/nutrition-database';
import { deleteNutritionDatabase } from '../../database/nutrition-database.testing';
import { APP_SETTINGS_SINGLETON_ID } from '../../models/app-settings';
import { BackupReminderService } from '../../backup/backup-reminder.service';
import { ShellComponent } from './shell.component';
import { ShellChromeService } from '../shell-chrome.service';
import { isMaisonSurfaceUrl } from '../maison-surface';

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class TestHostComponent {}

@Component({ template: '' })
class StubPageComponent {}

describe('ShellComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let database: DatabaseService;

  beforeEach(async () => {
    await deleteNutritionDatabase();
    await Dexie.delete(NUTRITION_DB_NAME);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ShellComponent, StubPageComponent],
      providers: [
        provideRouter([
          {
            path: '',
            component: ShellComponent,
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'pantry' },
              { path: 'home', component: StubPageComponent, data: { title: 'Accueil' } },
              { path: 'pantry', component: StubPageComponent, data: { title: 'Garde-manger' } },
              { path: 'recipes', component: StubPageComponent, data: { title: 'Recettes' } },
              { path: 'plan', component: StubPageComponent, data: { title: 'Plan' } },
              { path: 'products', component: StubPageComponent, data: { title: 'Produits' } },
              { path: 'shopping', component: StubPageComponent, data: { title: 'Courses' } },
              { path: 'goals', component: StubPageComponent, data: { title: 'Objectifs' } },
              { path: 'settings', component: StubPageComponent, data: { title: 'Paramètres' } },
            ],
          },
        ]),
      ],
    }).compileComponents();

    database = TestBed.inject(DatabaseService);
    await database.initialize();
    await TestBed.inject(BackupReminderService).refresh();

    hostFixture = TestBed.createComponent(TestHostComponent);
    await TestBed.inject(Router).navigateByUrl('/pantry');
    hostFixture.detectChanges();
  });

  afterEach(async () => {
    hostFixture?.destroy();
    await database.closeForTests();
    await deleteNutritionDatabase();
  });

  function getShellComponent(): ShellComponent {
    const shellDebug = hostFixture.debugElement.query(By.directive(ShellComponent));
    return shellDebug.componentInstance;
  }

  function getShellElement(): HTMLElement {
    return hostFixture.debugElement.query(By.directive(ShellComponent)).nativeElement;
  }

  function getShellRootElement(): HTMLElement {
    return getShellElement().querySelector('.shell') as HTMLElement;
  }

  it('renders five French bottom-nav labels', async () => {
    await TestBed.inject(Router).navigateByUrl('/pantry');
    hostFixture.detectChanges();

    const labels = Array.from(
      getShellElement().querySelectorAll('.bottom-nav__label'),
    ).map((element) => element.textContent?.trim());

    expect(labels).toEqual([
      'Garde-manger',
      'Produits',
      'Recettes',
      'Plan',
      'Courses',
    ]);
  });

  it('exposes a settings gear link to /settings', async () => {
    await TestBed.inject(Router).navigateByUrl('/pantry');
    hostFixture.detectChanges();

    const settingsLink = getShellElement().querySelector('.shell__settings') as HTMLAnchorElement;
    expect(settingsLink.getAttribute('aria-label')).toBe('Paramètres');
    expect(settingsLink.getAttribute('href')).toBe('/settings');
  });

  it('updates the header title from route data', async () => {
    await TestBed.inject(Router).navigateByUrl('/pantry');
    hostFixture.detectChanges();

    const shell = getShellComponent();
    const title = getShellElement().querySelector('.shell__title') as HTMLElement;
    expect(shell.pageTitle()).toBe('Garde-manger');
    expect(title.textContent?.trim()).toBe('Garde-manger');
  });

  it('shows Plan in the header when navigating to /plan', async () => {
    await TestBed.inject(Router).navigateByUrl('/plan');
    hostFixture.detectChanges();

    const shell = getShellComponent();
    const title = getShellElement().querySelector('.shell__title') as HTMLElement;
    expect(shell.pageTitle()).toBe('Plan');
    expect(title.textContent?.trim()).toBe('Plan');
  });

  it('links the header title to /home when not already on Accueil', async () => {
    await TestBed.inject(Router).navigateByUrl('/pantry');
    hostFixture.detectChanges();

    const titleLink = getShellElement().querySelector('a.shell__title') as HTMLAnchorElement;
    expect(titleLink).toBeTruthy();
    expect(titleLink.getAttribute('aria-label')).toBe('Garde-manger — Accueil');
    expect(titleLink.getAttribute('href')).toBe('/home');
    expect(titleLink.textContent?.trim()).toBe('Garde-manger');
  });

  it('keeps a static header title on /home', async () => {
    await TestBed.inject(Router).navigateByUrl('/home');
    hostFixture.detectChanges();

    expect(getShellElement().querySelector('a.shell__title')).toBeNull();
    const title = getShellElement().querySelector('h1.shell__title') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Accueil');
  });

  it('does not highlight a bottom-nav tab on /home and keeps five tabs', async () => {
    await TestBed.inject(Router).navigateByUrl('/home');
    hostFixture.detectChanges();

    const labels = Array.from(getShellElement().querySelectorAll('.bottom-nav__label')).map(
      (element) => element.textContent?.trim(),
    );
    expect(labels).toHaveLength(5);
    expect(getShellElement().querySelectorAll('.bottom-nav__item--active').length).toBe(0);
  });

  it('does not highlight a bottom-nav tab on /goals', async () => {
    await TestBed.inject(Router).navigateByUrl('/goals');
    hostFixture.detectChanges();

    const activeItems = getShellElement().querySelectorAll('.bottom-nav__item--active');
    expect(activeItems.length).toBe(0);
  });

  it('shows a French offline banner when the browser is offline', async () => {
    window.dispatchEvent(new Event('offline'));
    hostFixture.detectChanges();

    const banner = getShellElement().querySelector('.shell__offline-banner') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Mode hors ligne');
  });

  it('shows backup reminder when export is stale', async () => {
    const db = new NutritionDatabase();
    await db.open();
    await db.appSettings.put({
      id: APP_SETTINGS_SINGLETON_ID,
      theme: 'dark',
      lastExportAt: '2026-01-01T00:00:00.000Z',
    });
    await db.close();

    await TestBed.inject(BackupReminderService).refresh();
    hostFixture.detectChanges();

    const banner = getShellElement().querySelector('app-backup-reminder-banner');
    expect(banner).toBeTruthy();
    expect(getShellElement().textContent).toContain('Exporter');
  });

  it('hides backup reminder after dismiss', async () => {
    await TestBed.inject(BackupReminderService).dismiss();
    hostFixture.detectChanges();

    expect(getShellElement().querySelector('app-backup-reminder-banner')).toBeNull();
  });

  it('hides header and bottom nav when shell chrome is hidden', async () => {
    TestBed.inject(ShellChromeService).setHidden(true);
    hostFixture.detectChanges();

    expect(getShellElement().querySelector('.shell__header')).toBeNull();
    expect(getShellElement().querySelector('app-bottom-nav')).toBeNull();
  });

  it('applies maison forest theme on pantry, recipes, plan and products', async () => {
    const router = TestBed.inject(Router);

    for (const path of ['/pantry', '/recipes', '/plan', '/products']) {
      await router.navigateByUrl(path);
      await hostFixture.whenStable();
      hostFixture.detectChanges();

      const shellEl = getShellRootElement();
      expect(isMaisonSurfaceUrl(router.url)).toBe(true);
      expect(shellEl.classList.contains('shell--maison')).toBe(true);
      expect(shellEl.querySelector('app-forest-ambience')).toBeTruthy();
    }
  });

  it('does not apply maison forest theme on shopping or home', async () => {
    const router = TestBed.inject(Router);

    for (const path of ['/home', '/shopping', '/goals']) {
      await router.navigateByUrl(path);
      await hostFixture.whenStable();
      hostFixture.detectChanges();

      const shellEl = getShellRootElement();
      expect(isMaisonSurfaceUrl(router.url)).toBe(false);
      expect(shellEl.classList.contains('shell--maison')).toBe(false);
      expect(shellEl.querySelector('app-forest-ambience')).toBeNull();
    }
  });
});
