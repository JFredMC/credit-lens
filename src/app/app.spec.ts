import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App shell', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] }),
  );

  it('shows the permanent disclaimer and the JFredDev link in a new tab', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="disclaimer"]')?.textContent).toContain(
      'datos ficticios',
    );
    const link = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('JFredDev'));
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });
});
