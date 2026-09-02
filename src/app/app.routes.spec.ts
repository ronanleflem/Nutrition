import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { vi } from 'vitest';

import { routes } from './app.routes';
import { DatabaseService } from './core/database/database.service';
import { NotFoundPageComponent } from './core/layout/not-found/not-found-page.component';

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class RoutesHostComponent {}

describe('app routes', () => {
  let fixture: ComponentFixture<RoutesHostComponent>;
  let router: Router;
  let database: DatabaseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesHostComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(RoutesHostComponent);
    router = TestBed.inject(Router);
    database = TestBed.inject(DatabaseService);
    fixture.detectChanges();
  });

  async function navigateAndSettle(path: string, expectedText: string): Promise<void> {
    await router.navigateByUrl(path);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    for (let attempt = 0; attempt < 50; attempt++) {
      const text = fixture.nativeElement.textContent as string;
      if (text.includes(expectedText)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
      await fixture.whenStable();
    }

    throw new Error(
      `Timed out waiting for "${expectedText}". Got: ${fixture.nativeElement.textContent}`,
    );
  }

  const lazyRoutes = [
    { path: '/home', text: 'Repas du jour' },
    { path: '/pantry', text: '+' },
    { path: '/products', text: 'Ajouter un produit' },
    { path: '/recipes', text: '+' },
    { path: '/plan', text: 'Voir la synthèse macros' },
    { path: '/shopping', text: 'Liste de courses' },
    { path: '/goals', text: 'Objectifs macros' },
    { path: '/settings', text: 'Objectifs macros' },
  ];

  for (const route of lazyRoutes) {
    it(`loads lazy route ${route.path}`, async () => {
      await navigateAndSettle(route.path, route.text);
      expect(fixture.nativeElement.textContent).toContain(route.text);
    });
  }

  it('redirects / to /home when hideHomeOnStartup is unset', async () => {
    await database.updateHideHomeOnStartup(false);
    await navigateAndSettle('/', 'Repas du jour');
    expect(router.url).toBe('/home');
  });

  it('redirects / to /pantry when hideHomeOnStartup is true', async () => {
    await database.updateHideHomeOnStartup(true);
    await navigateAndSettle('/', '+');
    expect(router.url).toBe('/pantry');
  });

  it('redirects / to /home when reading settings fails', async () => {
    vi.spyOn(database, 'getAppSettings').mockRejectedValueOnce(new Error('fail'));
    await navigateAndSettle('/', 'Repas du jour');
    expect(router.url).toBe('/home');
  });

  it('shows not-found page for unknown paths instead of redirecting to pantry', async () => {
    await router.navigateByUrl('/route-inconnue');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Page introuvable.');
    expect(fixture.debugElement.query(By.directive(NotFoundPageComponent))).toBeTruthy();
  });
});
