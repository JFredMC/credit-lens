import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">Credit Lens</p>
        <h1>Tu crédito, claro</h1>
        <p class="lead">
          Un centro de crédito personal pensado para entender tu historial, no solo para verlo. Esta
          demo usa perfiles ficticios.
        </p>
      </div>
    </header>
  `,
})
export class Home {}
