import { CreditReport } from '../domain/report';

const W = 1080;
const H = 1350;
const PAD = 80;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Shareable summary card (no document number, no entities): score, band and 4 indicators. */
export function drawReportCard(r: CreditReport, doc: Document = document): HTMLCanvasElement {
  const c = doc.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  if (!x) throw new Error('Canvas no disponible');
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#171b2e');
  g.addColorStop(1, '#312e81');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#fff';
  x.font = `800 48px ${FONT}`;
  x.fillText('Credit Lens', PAD, PAD + 50);
  x.fillStyle = '#c7c9ee';
  x.font = `500 30px ${FONT}`;
  x.fillText(`Mi crédito al ${r.asOfLabel}`, PAD, PAD + 110);
  // gauge
  const cx = W / 2;
  const cy = 560;
  const rad = 260;
  x.lineCap = 'round';
  x.lineWidth = 44;
  x.strokeStyle = 'rgba(255,255,255,0.14)';
  x.beginPath();
  x.arc(cx, cy, rad, Math.PI, 2 * Math.PI);
  x.stroke();
  const t = Math.min(1, Math.max(0, (r.score - 150) / 800));
  x.strokeStyle = t >= 0.71 ? '#34d399' : t >= 0.56 ? '#fbbf24' : '#f87171';
  x.beginPath();
  x.arc(cx, cy, rad, Math.PI, Math.PI + Math.PI * t);
  x.stroke();
  x.textAlign = 'center';
  x.fillStyle = '#fff';
  x.font = `800 150px ${FONT}`;
  x.fillText(String(r.score), cx, cy - 20);
  x.fillStyle = '#c7c9ee';
  x.font = `600 40px ${FONT}`;
  x.fillText(r.band, cx, cy + 50);
  x.textAlign = 'left';
  const pick = ['Uso de cupos', 'Pagos a tiempo (24 meses)', 'Cuotas / ingreso', 'Saldo en mora'];
  let y = 720;
  for (const [label, value] of r.kpis.filter(([l]) => pick.includes(l))) {
    x.strokeStyle = 'rgba(255,255,255,0.14)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(PAD, y);
    x.lineTo(W - PAD, y);
    x.stroke();
    x.fillStyle = '#e6e7fb';
    x.font = `500 36px ${FONT}`;
    x.fillText(label, PAD, y + 64);
    x.textAlign = 'right';
    x.fillStyle = '#fff';
    x.font = `700 38px ${FONT}`;
    x.fillText(value, W - PAD, y + 64);
    x.textAlign = 'left';
    y += 100;
  }
  x.fillStyle = 'rgba(230,231,251,0.7)';
  x.font = `400 26px ${FONT}`;
  x.fillText(
    'Puntaje educativo ficticio · demo sin afiliación a centrales de riesgo',
    PAD,
    H - 150,
    W - PAD * 2,
  );
  x.fillStyle = '#fff';
  x.font = `700 32px ${FONT}`;
  x.fillText('jfredmc.github.io/credit-lens', PAD, H - 80);
  x.textAlign = 'right';
  x.fillStyle = 'rgba(230,231,251,0.6)';
  x.font = `500 24px ${FONT}`;
  x.fillText('by JFredDev', W - PAD, H - 80);
  return c;
}

export function reportCardPng(r: CreditReport, doc: Document = document): Promise<Blob> {
  const c = drawReportCard(r, doc);
  return new Promise((ok, ko) =>
    c.toBlob((b) => (b ? ok(b) : ko(new Error('No se pudo crear la imagen'))), 'image/png'),
  );
}
