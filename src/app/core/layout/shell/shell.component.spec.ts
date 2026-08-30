import 'fake-indexeddb/auto';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';

import { ShellComponent } from './shell.component';

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class TestHostComponent {}

@Component({ template: '' })
class StubPageComponent {}

describe('ShellComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ShellComponent, StubPageComponent],
      providers: [
        provideRouter([
          {
            path: '',
            component: ShellComponent,
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'pantry' },
              { path: 'pantry', component: StubPageComponent, data: { title: 'Garde-manger' } },
              { path: 'plan', component: StubPageComponent, data: { title: 'Plan' } },
              { path: 'goals', component: StubPageComponent, data: { title: 'Objectifs' } },
              { path: 'settings', component: StubPageComponent, data: { title: 'Paramètres' } },
            ],
          },
        ]),
      ],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    await TestBed.inject(Router).navigateByUrl('/pantry');
    hostFixture.detectChanges();
  });

  function getShellComponent(): ShellComponent {
    const shellDebug = hostFixture.debugElement.query(By.directive(ShellComponent));
    return shellDebug.componentInstance;
  }

  function getShellElement(): HTMLElement {
    return hostFixture.debugElement.query(By.directive(ShellComponent)).nativeElement;
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
});
