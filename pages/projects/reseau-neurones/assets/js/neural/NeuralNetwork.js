/* =====================================================================
 * NeuralNetwork.js — MODÈLE PUR (zéro DOM, zéro canvas)
 * Chemin : pages/projets/reseau-neurones/assets/js/neural/NeuralNetwork.js
 * Réseau 2–4–1 (tanh → sigmoïde) résolvant le XOR.
 * API publique :
 *   - forward(x)     : activations de chaque couche
 *   - trainEpoch(lr) : une époque complète (4 exemples), renvoie la MSE
 *   - getState()     : snapshot sérialisable (poids, biais, activations)
 * ===================================================================== */

export class NeuralNetwork {
  constructor(topology = [2, 4, 1], seed = 42) {
    this.sizes = topology;
    // PRNG déterministe (mulberry32) : entraînements reproductibles,
    // indispensable pour des tests unitaires et un affichage stable.
    this._rng = this._mulberry32(seed);
    this.reset();
  }

  _mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  reset() {
    // Initialisation Xavier/He : variance ∝ 1/(fan-in + fan-out),
    // évite la saturation des tanh et accélère la convergence.
    this.weights = [];
    this.biases = [];
    for (let l = 0; l < this.sizes.length - 1; l++) {
      const fanIn = this.sizes[l], fanOut = this.sizes[l + 1];
      const scale = Math.sqrt(2 / (fanIn + fanOut));
      const W = new Float64Array(fanIn * fanOut);
      for (let i = 0; i < W.length; i++) W[i] = (this._rng() * 2 - 1) * scale * 3;
      this.weights.push(W);
      this.biases.push(new Float64Array(fanOut)); // biais init à 0
    }
    this.epoch = 0;
    this.lastActivations = this.forward([0, 0]);
    return this.getState();
  }

  /* Passe avant. tanh caché (sortie centrée, dérivée simple),
   * sigmoïde en sortie pour une probabilité ∈ [0, 1].
   * Float64Array : mémoire contiguë, zéro pression GC à 60 FPS. */
  forward(input) {
    const acts = [Float64Array.from(input)];
    for (let l = 0; l < this.weights.length; l++) {
      const W = this.weights[l], b = this.biases[l];
      const prev = acts[l], out = new Float64Array(b.length);
      for (let j = 0; j < b.length; j++) {
        let z = b[j];
        for (let i = 0; i < prev.length; i++) z += W[i * b.length + j] * prev[i];
        out[j] = (l === this.weights.length - 1)
          ? 1 / (1 + Math.exp(-z))           // sigmoïde (sortie)
          : Math.tanh(z);                    // tanh (couches cachées)
      }
      acts.push(out);
    }
    return acts;
  }

  /* Rétropropagation sur le batch complet (les 4 exemples du XOR).
   * Retourne la perte quadratique moyenne de l'époque. */
  trainEpoch(lr) {
    const data = [[0,0,0],[0,1,1],[1,0,1],[1,1,0]];
    const L = this.weights.length;
    // Accumulateurs de gradients, alloués une seule fois par époque.
    const gW = this.weights.map(W => new Float64Array(W.length));
    const gB = this.biases.map(b => new Float64Array(b.length));
    let loss = 0;

    for (const [x1, x2, target] of data) {
      const acts = this.forward([x1, x2]);
      const out = acts[L][0];
      loss += 0.5 * (out - target) ** 2;

      // Delta de sortie : (MSE + sigmoïde) → dérivée simplifiée.
      let delta = new Float64Array([(out - target) * out * (1 - out)]);
      for (let l = L - 1; l >= 0; l--) {
        const prev = acts[l], W = this.weights[l];
        // Accumulation des gradients
        for (let i = 0; i < prev.length; i++)
          for (let j = 0; j < delta.length; j++)
            gW[l][i * delta.length + j] += prev[i] * delta[j];
        for (let j = 0; j < delta.length; j++) gB[l][j] += delta[j];

        if (l > 0) {
          // Propagation du delta vers la couche précédente (tanh')
          const nextDelta = new Float64Array(prev.length);
          for (let i = 0; i < prev.length; i++) {
            let e = 0;
            for (let j = 0; j < delta.length; j++) e += W[i * delta.length + j] * delta[j];
            nextDelta[i] = e * (1 - prev[i] * prev[i]);
          }
          delta = nextDelta;
        }
      }
    }

    // Descente de gradient (batch, sans momentum pour rester lisible)
    for (let l = 0; l < L; l++) {
      for (let k = 0; k < this.weights[l].length; k++)
        this.weights[l][k] -= lr * gW[l][k] / 4;
      for (let j = 0; j < this.biases[l].length; j++)
        this.biases[l][j] -= lr * gB[l][j] / 4;
    }

    this.epoch++;
    this.lastActivations = this.forward([0, 0]);
    return loss / 4;
  }

  /* Snapshot de l'état : le visualiseur ne lit JAMAIS les tableaux
   * internes du réseau — découplage total modèle / vue. */
  getState() {
    return {
      epoch: this.epoch,
      sizes: this.sizes.slice(),
      weights: this.weights.map(W => Array.from(W)),
      biases: this.biases.map(b => Array.from(b)),
      activations: this.lastActivations.map(a => Array.from(a)),
    };
  }
}
