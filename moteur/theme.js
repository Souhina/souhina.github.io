// moteur/theme.js
// Bouton de bascule jour/nuit des sites qui déclarent un themeNuit dans site.js.
// Il annonce toujours l'action qu'il déclenche : « Mode nuit » en journée, « Mode jour » la nuit.
// Sans choix de l'internaute, la page suit le réglage clair ou sombre de l'appareil.
// Le choix est mémorisé ; un petit script en tête de page l'applique avant l'affichage.

import { T } from './langue.js';

const CLE_STOCKAGE = 'theme-affichage';

export function brancherBascule() {
  const bouton = document.getElementById('bascule-theme');
  if (!bouton) return;

  const racine = document.documentElement;
  const sombreSysteme = window.matchMedia('(prefers-color-scheme: dark)');
  const modeActuel = () => racine.dataset.theme ?? (sombreSysteme.matches ? 'nuit' : 'jour');
  const texte = bouton.querySelector('.bascule-texte');
  const afficherEtat = () => {
    const nuit = modeActuel() === 'nuit';
    texte.textContent = nuit ? T().theme.modeJour : T().theme.modeNuit;
    bouton.title = nuit ? T().theme.versClair : T().theme.versSombre;
    // L'icône montre le mode vers lequel on bascule : le soleil la nuit, la lune le jour.
    bouton.dataset.cible = nuit ? 'jour' : 'nuit';
  };

  bouton.addEventListener('click', () => {
    const suivant = modeActuel() === 'nuit' ? 'jour' : 'nuit';
    racine.dataset.theme = suivant;
    try {
      localStorage.setItem(CLE_STOCKAGE, suivant);
    } catch {
      // Navigation privée : le choix vaut pour la page en cours seulement.
    }
    afficherEtat();
  });

  sombreSysteme.addEventListener('change', afficherEtat);
  afficherEtat();
}
