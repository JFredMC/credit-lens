// GitHub Pages has no SPA rewrites: serve the app shell for unknown paths via 404.html.
import { copyFileSync } from 'node:fs';
const dir = new URL('../dist/credit-lens/browser/', import.meta.url).pathname;
copyFileSync(dir + 'index.html', dir + '404.html');
console.log('404.html written');
