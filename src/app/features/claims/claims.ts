import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../core/demo-store';
import {
  CLAIM_TYPES,
  ClaimInput,
  ClaimType,
  buildLetter,
  claimDeadlines,
  letterHeader,
} from '../../domain/claim-letter';
import { formatCOP, formatDate, parseISO } from '../../domain/format';
import { PRODUCT_LABEL, Product } from '../../domain/models';
import { downloadClaimPdf } from './claim-pdf';

@Component({
  selector: 'app-claims',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './claims.html',
  styleUrl: './claims.css',
})
export class Claims {
  protected readonly store = inject(DemoStore);
  protected readonly types = CLAIM_TYPES;
  protected readonly date = formatDate;
  protected readonly typeLabel = PRODUCT_LABEL;

  protected readonly type = signal<ClaimType>('actualizacion');
  protected readonly productId = signal('');
  protected readonly fullName = signal('');
  protected readonly documentNumber = signal('');
  protected readonly city = signal('');
  protected readonly address = signal('');
  protected readonly email = signal('');
  protected readonly recipient = signal('');
  protected readonly facts = signal('');
  protected readonly filed = signal('');
  protected readonly busy = signal(false);

  protected readonly product = computed<Product | undefined>(() =>
    this.store.persona().products.find((p) => p.id === this.productId()),
  );

  protected readonly input = computed<ClaimInput>(() => {
    const p = this.product();
    return {
      type: this.type(),
      fullName: this.fullName(),
      documentNumber: this.documentNumber(),
      city: this.city(),
      address: this.address(),
      email: this.email(),
      recipient: this.recipient(),
      obligation: p ? `${PRODUCT_LABEL[p.type].toLowerCase()} con ${p.entity}` : '',
      amount: p ? p.overdueAmount || p.balance || undefined : undefined,
      facts: this.facts(),
      date: this.filed() || this.store.asOfIso,
    };
  });
  protected readonly letter = computed(() => buildLetter(this.input()));
  protected readonly header = computed(() => letterHeader(this.input()));
  protected readonly deadlines = computed(() =>
    claimDeadlines(this.filed() || this.store.asOfIso, parseISO),
  );

  constructor() {
    // Prefill with the (fictional) persona data.
    effect(() => {
      const p = this.store.persona();
      this.fullName.set(p.name);
      this.documentNumber.set('1.000.000.000 (ficticio)');
      this.city.set(p.city);
      this.address.set('Calle 10 # 20-30 (ficticia)');
      this.email.set(`${p.id}@correo-ficticio.co`);
      this.filed.set(this.store.asOfIso);
      const pick =
        p.products.find((x) => x.status === 'EN_MORA') ??
        p.products.find((x) => x.history.some((m) => m.startsWith('M'))) ??
        p.products[0];
      this.productId.set(pick.id);
    });
    // Suggested facts and recipient whenever the type or product changes.
    effect(() => {
      const p = this.product();
      const t = this.type();
      if (!p) return;
      this.recipient.set(p.entity);
      this.facts.set(this.suggestFacts(t, p));
    });
  }

  protected async download(): Promise<void> {
    this.busy.set(true);
    try {
      await downloadClaimPdf(this.input(), this.letter());
    } finally {
      this.busy.set(false);
    }
  }

  private suggestFacts(t: ClaimType, p: Product): string {
    const prod = `${PRODUCT_LABEL[p.type].toLowerCase()} con ${p.entity}`;
    switch (t) {
      case 'actualizacion':
        return `Tengo la obligación «${prod}».\nPagué las cuotas vencidas el [fecha de pago] y adjunto el soporte.\nA la fecha, la obligación sigue reportada en mora.`;
      case 'permanencia':
        return `Tuve una mora en la obligación «${prod}» que inició el [fecha] y pagué el [fecha].\nSegún el artículo 13 de la Ley 1266 de 2008, el término de permanencia ya se cumplió y el dato negativo sigue visible.`;
      case 'sin-aviso':
        return `Fui reportado(a) negativamente por la obligación «${prod}».\nNo recibí la comunicación previa al reporte en mi dirección ni en mi correo registrados.`;
      case 'rectificacion':
        return `En mi historial aparece la obligación «${prod}» con el saldo o estado [dato incorrecto].\nEl dato correcto es [dato correcto], según los soportes que adjunto (${formatCOP(p.balance)} de saldo a la fecha).`;
      case 'suplantacion':
        return `En mi historial aparece la obligación «${prod}», que no solicité ni autoricé.\nSoy víctima de suplantación de identidad y presenté la denuncia correspondiente el [fecha].`;
    }
  }
}
