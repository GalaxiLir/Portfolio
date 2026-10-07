/* =====================================================================
   script.js — comportements de la page d'accueil.
   Chargé avec "defer" : s'exécute après le HTML, pas de bloque.
   ===================================================================== */

// 1) Smooth scroll natif pour la navigation d'ancre
//    (le CSS scroll-behavior gère le cas préfères-pas-d'animation)
document.querySelector('html').style.scrollBehavior = 'smooth';

// 2) Bouton "Explore" → descend vers la première section
document.getElementById('explore-button').addEventListener('click', () => {
  document.getElementById('research')?.scrollIntoView();
});

// 3) Lien actif dans la nav : IntersectionObserver observe quelles
//    sections sont visibles et surligne le lien correspondant.
//    Pourquoi pas un scroll listener ? Parce qu'un listener scroll
//    se déclenche ~60×/s et lit le layout à chaque fois (reflow).
//    L'observer est déclenché PAR le navigateur, hors du thread
//    de rendu critique. C'est l'outil prévu pour ça.
const links = document.querySelectorAll('.nav-links a');
const map = new Map();                     // section id → lien nav
links.forEach(a => {
  const id = a.getAttribute('href').slice(1);
  map.set(id, a);
});

const observer = new IntersectionObserver(entries => {
  for (const e of entries) {
    const link = map.get(e.target.id);
    if (link) link.style.color = e.isIntersecting ? 'var(--accent)' : '';
  }
}, { rootMargin: '-40% 0px -55% 0px' });    // "section au milieu de l'écran"

document.querySelectorAll('main section[id]').forEach(s => observer.observe(s));
