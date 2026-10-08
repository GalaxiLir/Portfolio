import { NeuralNetwork } from './NeuralNetwork.js';
import { NetworkVisualizer } from './NetworkVisualizer.js';

/* ------------------- MODULE 3 : main (contrôleur) ------------------- */
/* Seul endroit où l'on parle au DOM. Principe clé : les événements
 * 'input' ne font QUE muter une variable — tout le travail lourd est
 * regroupé dans la boucle rAF, une seule écriture DOM par frame. */

const $ = id => document.getElementById(id);
const net = new NeuralNetwork([2, 4, 1]);
const viz = new NetworkVisualizer($('network-canvas'));

const params = { lr: 0.5, epochsPerFrame: 2, running: true };
let lastState = net.getState();

/* Regroupement des mises à jour DOM : lire layout → écrire → relayout
 * est coûteux ; on n'écrit qu'une fois par image, dans le rAF. */
function updateDOM(state, loss) {
  $('epoch-val').textContent = state.epoch;
  $('loss-val').textContent = loss == null ? '—' : loss.toExponential(2);
  const rows = [[0,0],[0,1],[1,0],[1,1]];
  const targets = [0, 1, 1, 0];
  $('truth-body').innerHTML = rows.map(([a, b], i) => {
    const out = net.forward([a, b]).at(-1)[0];
    const ok = Math.round(out) === targets[i];
    return `<tr><td>${a}</td><td>${b}</td><td class="${ok ? 'ok' : 'ko'}">${out.toFixed(3)}</td><td>${targets[i]}</td></tr>`;
  }).join('');
}

/* Boucle d'animation unique : 60 FPS = ~16.7 ms de budget par image.
 * On entraîne N époques (< 1 ms chacune), on pique un snapshot, on
 * redessine, on met à jour le texte. Aucun setInterval, aucun setTimeout. */
function frame() {
  if (params.running) {
    let loss = null;
    for (let e = 0; e < params.epochsPerFrame; e++) loss = net.trainEpoch(params.lr);
    lastState = net.getState();
    updateDOM(lastState, loss);
  }
  viz.render(lastState);
  requestAnimationFrame(frame);
}

/* Contrôles : délégation d'événements + pas de travail dans le handler */
$('lr-slider').addEventListener('input', e => {
  params.lr = +e.target.value;
  $('lr-out').textContent = params.lr.toFixed(2);
});
$('speed-slider').addEventListener('input', e => {
  params.epochsPerFrame = +e.target.value;
  $('speed-out').textContent = params.epochsPerFrame;
});
$('play-btn').addEventListener('click', e => {
  params.running = !params.running;
  e.target.textContent = params.running ? '⏸ Pause' : '▶ Lecture';
  e.target.setAttribute('aria-pressed', String(params.running));
});
$('reset-btn').addEventListener('click', () => {
  lastState = net.reset();
  updateDOM(lastState, null);
});

updateDOM(lastState, null);
requestAnimationFrame(frame);
</script>
</body>
</html>
