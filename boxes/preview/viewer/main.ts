/** The preview page: find the two containers, start the viewer. */
import { boot } from './boot.ts';

const stage = document.getElementById('stage');
const panel = document.getElementById('panel');

if (!stage || !panel) {
  document.body.textContent = 'preview page is missing its stage or panel element';
} else {
  boot({ stage, panel });
}
