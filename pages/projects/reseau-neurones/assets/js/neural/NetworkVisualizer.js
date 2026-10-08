/* =====================================================================
 * NetworkVisualizer.js — VUE CANVAS (zéro logique d'apprentissage)
 * Chemin : pages/projets/reseau-neurones/assets/js/neural/NetworkVisualizer.js
 * Responsabilité unique : transformer un état getState() en pixels.
 * Ne connaît ni les contrôles HTML ni la logique d'entraînement.
 * ===================================================================== */

export class NetworkVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /* Haute densité de pixels : le canvas est dessiné en dpr× puis
   * réduit en CSS — rendu net sur écrans Retina. */
  resize() {
    const { clientWidth, clientHeight } = this.canvas;
    this.w = clientWidth; this.h = clientHeight;
    this.canvas.width = clientWidth * this.dpr;
    this.canvas.height = clientHeight * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /* Position des neurones, recalculée seulement quand la géométrie
   * change (resize), pas à chaque frame. */
  _layout(sizes) {
    const nodes = [];
    const padX = this.w * 0.14, padY = this.h * 0.12;
    sizes.forEach((n, layer) => {
      const x = padX + layer * (this.w - 2 * padX) / (sizes.length - 1);
      for (let i = 0; i < n; i++) {
        const y = n === 1 ? this.h / 2
          : padY + i * (this.h - 2 * padY) / (n - 1);
        nodes.push({ x, y, layer, index: i });
      }
    });
    return nodes;
  }

  /* RENDER : une image complète à partir d'un état.
   * Connexions : couleur = signe du poids, épaisseur = |w| normalisé.
   * Neurones : remplissage = activation ∈ [-1, 1]. */
  render(state) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const nodes = this._layout(state.sizes);

    let nodeIdx = 0;
    const layerStart = [];
    state.sizes.forEach((n, l) => { layerStart[l] = nodeIdx; nodeIdx += n; });

    // --- Connexions ---
    for (let l = 0; l < state.weights.length; l++) {
      const W = state.weights[l], nOut = state.sizes[l + 1];
      for (let i = 0; i < state.sizes[l]; i++) {
        for (let j = 0; j < nOut; j++) {
          const w = W[i * nOut + j];
          const a = nodes[layerStart[l] + i], b = nodes[layerStart[l + 1] + j];
          const mag = Math.min(Math.abs(w), 3) / 3;          // normalisation
          const alpha = 0.15 + 0.75 * mag;
          ctx.strokeStyle = w >= 0
            ? `rgba(94, 234, 212, ${alpha})`   // positif → turquoise
            : `rgba(244, 114, 182, ${alpha})`; // négatif → rose
          ctx.lineWidth = 0.5 + 3.5 * mag;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // --- Neurones ---
    let k = 0;
    for (let layer = 0; layer < state.sizes.length; layer++) {
      for (let i = 0; i < state.sizes[layer]; i++, k++) {
        const n = nodes[k];
        const act = state.activations[layer][i] ?? 0;
        const isOutput = layer === state.sizes.length - 1;
        const r = isOutput ? 18 : 13;

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        // Interpolation bleu (inactive) → turquoise (active)
        const t = Math.max(0, Math.min(1, (act + 1) / 2));
        ctx.fillStyle = `rgb(${Math.round(59 + 35 * t)}, ${Math.round(130 + 104 * t)}, ${Math.round(246 - 214 * t)})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();

        // Valeur d'activation affichée (pédagogie)
        ctx.fillStyle = '#e7ecf7';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(act.toFixed(2), n.x, n.y);
      }
    }
  }
}
