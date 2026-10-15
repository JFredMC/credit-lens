import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_NAME, NAV, PORTFOLIO_URL, TAGLINE } from './core/site';
import { ThemeService } from './core/theme.service';
import { DemoStore } from './core/demo-store';
import { Icon } from './shared/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly themeSvc = inject(ThemeService);
  protected readonly store = inject(DemoStore);
  protected readonly nav = NAV;
  protected readonly appName = APP_NAME;
  protected readonly tagline = TAGLINE;
  protected readonly portfolio = PORTFOLIO_URL;
  protected readonly year = new Date().getFullYear();
  protected readonly sun =
    'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z';
  protected readonly moon = 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z';
}
