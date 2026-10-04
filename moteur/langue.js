// moteur/langue.js
// Langue de l'interface : textes du moteur (boutons, messages, récapitulatif, PDF, mentions),
// regroupés par langue dans moteur/langues/<code>.js. Le contenu des calculateurs reste dans
// leurs propres fichiers.
//
// - Dans le navigateur, la langue est celle de <html lang="…"> de la page.
// - À la génération, build.js choisit la langue de chaque page avec utiliserLangue().
// build.js réécrit la liste LANGUES dans dist/assets/langue.js avec les langues déclarées
// dans site.js (clé langues), pour que le navigateur ne charge que celles-ci.

import fr from './langues/fr.js';

const LANGUES = { fr };
let active = fr;

export function enregistrerLangue(textes) {
  LANGUES[textes.code] = textes;
}

export function utiliserLangue(code) {
  active = LANGUES[code] ?? fr;
  return active;
}

// Textes d'une langue précise (adresses des autres langues, sitemap).
export function textesDe(code) {
  return LANGUES[code] ?? fr;
}

// Textes de la langue active.
export function T() {
  return active;
}

if (typeof document !== 'undefined' && document.documentElement?.lang) utiliserLangue(document.documentElement.lang);
