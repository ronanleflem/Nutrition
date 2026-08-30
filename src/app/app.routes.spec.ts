import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';

import { routes } from './app.routes';
import { NotFoundPageComponent } from './core/layout/not-found/not-found-page.component';

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class RoutesHostComponent {}

describe('app routes', () => {
  let fixture: ComponentFixture<RoutesHostComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesHostComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(RoutesHostComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  const lazyRoutes = [
  { path: '/pantry', text: '+' },
  { path: '/products', text: 'Surface en construction.' },
  { path: '/recipes', text: 'Surface en construction.' },
  { path: '/plan', text: 'Surface en construction.' },
  { path: '/shopping', text: 'Surface en construction.' },
  { path: '/goals', text: 'Surface en construction.' },
  { path: '/settings', text: 'Surface en construction.' },
  ];

  for (const route of lazyRoutes) {
    it(`loads lazy route ${route.path}`, async () => {
      await router.navigateByUrl(route.path);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(route.text);
    });
  }

  it('shows not-found page for unknown paths instead of redirecting to pantry', async () => {
    await router.navigateByUrl('/route-inconnue');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Page introuvable.');
    expect(fixture.debugElement.query(By.directive(NotFoundPageComponent))).toBeTruthy();
  });
});
