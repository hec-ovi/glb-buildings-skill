/** The preview page: find the three containers, start the viewer. */
import { boot } from './boot.ts';

const stage = document.getElementById('stage');
const side = document.getElementById('models');
const bar = document.getElementById('bar');

if (!stage || !side || !bar) {
  document.body.textContent = 'preview page is missing the stage, the navigator or the bar';
} else {
  boot({ stage, side, bar });
}
