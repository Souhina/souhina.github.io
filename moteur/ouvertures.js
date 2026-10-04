// moteur/ouvertures.js
// Portes, fenêtres et portes-fenêtres placées sur les côtés du plan.
// Module pur, sans DOM : utilisé par l'éditeur de plan, par le script des calculateurs et par test.js.
//
// Une ouverture : { type, cote, largeur, hauteur, position }
// - cote : index du côté du plan (côté i = de l'angle i à l'angle i + 1) ;
// - largeur, hauteur, position en centimètres ; position = distance entre l'angle de départ
//   du côté et le bord de l'ouverture.

import { T } from './langue.js';

// Dimensions courantes, à vérifier sur place (tableau de départ, modifiable par l'internaute).
export const TYPES_OUVERTURE = {
  porte: { libelle: 'Porte', abreviation: 'P', largeur: 83, hauteur: 204 },
  fenetre: { libelle: 'Fenêtre', abreviation: 'F', largeur: 120, hauteur: 135 },
  'porte-fenetre': { libelle: 'Porte-fenêtre', abreviation: 'PF', largeur: 120, hauteur: 215 },
};

// Valeurs exposées aux calculateurs par la clé remplacePar d'un champ.
// surfaceTableaux : retours de tableau des ouvertures dans les murs épais (fournie par chantier-plan.js).
export const VALEURS_OUVERTURES = ['surfaceOuvertures', 'largeurPortes', 'largeurPortesFenetres', 'nombrePortes', 'nombreOuvertures', 'surfaceTableaux'];

const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const arrondi = (valeur, decimales) => Math.round(valeur * 10 ** decimales) / 10 ** decimales;

export function longueurCote(points, cote) {
  return distance(points[cote], points[(cote + 1) % points.length]);
}

// Nom court d'une ouverture : P1, F1, PF1… numérotées par type dans l'ordre de la liste.
export function nomsOuvertures(ouvertures) {
  const compteurs = {};
  return ouvertures.map((ouverture) => {
    compteurs[ouverture.type] = (compteurs[ouverture.type] ?? 0) + 1;
    return `${T().ouvertures.abreviations[ouverture.type] ?? '?'}${compteurs[ouverture.type]}`;
  });
}

// Nettoie une liste reçue (stockage, lien de partage) : types connus, côtés existants,
// dimensions positives, ouverture ramenée à l'intérieur de son côté.
export function normaliserOuvertures(liste, points) {
  if (!Array.isArray(liste) || !Array.isArray(points) || points.length < 3) return [];
  return liste
    .filter((ouverture) => ouverture && TYPES_OUVERTURE[ouverture.type] && Number.isInteger(ouverture.cote) && ouverture.cote >= 0 && ouverture.cote < points.length)
    .map((ouverture) => {
      const longueur = longueurCote(points, ouverture.cote);
      const largeur = Math.max(1, Math.round(Number(ouverture.largeur) || TYPES_OUVERTURE[ouverture.type].largeur));
      const hauteur = Math.max(1, Math.round(Number(ouverture.hauteur) || TYPES_OUVERTURE[ouverture.type].hauteur));
      const position = Math.round(Math.min(Math.max(0, Number(ouverture.position) || 0), Math.max(0, longueur - largeur)));
      return { type: ouverture.type, cote: ouverture.cote, largeur, hauteur, position };
    });
}

// Totaux utilisés par les calculateurs.
// largeurPortes : portes et portes-fenêtres (ouvertures au sol, sans plinthe ni lé de papier en bas) ;
// largeurPortesFenetres : grandes ouvertures seules ; nombrePortes : portes intérieures (seuils).
export function totauxOuvertures(ouvertures) {
  const somme = (filtre, valeur) => ouvertures.filter(filtre).reduce((total, ouverture) => total + valeur(ouverture), 0);
  const compte = (type) => ouvertures.filter((ouverture) => ouverture.type === type).length;
  const libelles = [
    [compte('porte'), ...T().ouvertures.porte],
    [compte('fenetre'), ...T().ouvertures.fenetre],
    [compte('porte-fenetre'), ...T().ouvertures.porteFenetre],
  ]
    .filter(([nombre]) => nombre > 0)
    .map(([nombre, singulier, pluriel]) => `${nombre} ${nombre > 1 ? pluriel : singulier}`);

  return {
    surfaceOuvertures: arrondi(somme(() => true, (o) => (o.largeur * o.hauteur) / 10000), 4),
    largeurPortes: arrondi(somme((o) => o.type !== 'fenetre', (o) => o.largeur / 100), 2),
    largeurPortesFenetres: arrondi(somme((o) => o.type === 'porte-fenetre', (o) => o.largeur / 100), 2),
    nombrePortes: compte('porte'),
    nombreOuvertures: ouvertures.length,
    descriptionOuvertures: libelles.join(', '),
  };
}

// Ajout d'un angle sur le côté « cote » : le côté est coupé en deux ;
// chaque ouverture reste sur la moitié qui contient son centre.
export function insererAngle(ouvertures, points, cote, nouveauPoint) {
  const longueurAvant = distance(points[cote], nouveauPoint);
  return ouvertures.map((ouverture) => {
    if (ouverture.cote < cote) return { ...ouverture };
    if (ouverture.cote > cote) return { ...ouverture, cote: ouverture.cote + 1 };
    const centre = ouverture.position + ouverture.largeur / 2;
    return centre <= longueurAvant ? { ...ouverture } : { ...ouverture, cote: cote + 1, position: ouverture.position - longueurAvant };
  });
}

// Suppression de l'angle « index » : les deux côtés qui s'y rejoignent n'en font plus qu'un.
// Les ouvertures de ces deux côtés sont reportées sur le nouveau côté, à la même proportion de longueur.
export function supprimerAngle(ouvertures, points, index) {
  const n = points.length;
  const precedent = (index - 1 + n) % n;
  const suivant = (index + 1) % n;
  const nouvelIndex = (i) => (i < index ? i : i - 1);
  const longueur1 = distance(points[precedent], points[index]);
  const longueur2 = distance(points[index], points[suivant]);
  const nouvelleLongueur = distance(points[precedent], points[suivant]);
  const rapport = longueur1 + longueur2 > 0 ? nouvelleLongueur / (longueur1 + longueur2) : 0;

  return ouvertures.map((ouverture) => {
    if (ouverture.cote === precedent) return { ...ouverture, cote: nouvelIndex(precedent), position: ouverture.position * rapport };
    if (ouverture.cote === index) return { ...ouverture, cote: nouvelIndex(precedent), position: (longueur1 + ouverture.position) * rapport };
    return { ...ouverture, cote: nouvelIndex(ouverture.cote) };
  });
}

// Emplacement d'une nouvelle ouverture : le plus grand espace libre de tous les murs,
// en laissant 10 cm à chaque angle ; l'ouverture y est centrée.
export function emplacementLibre(ouvertures, points, largeur) {
  let meilleur = { cote: 0, debut: 0, fin: 0 };
  for (let cote = 0; cote < points.length; cote++) {
    const longueur = longueurCote(points, cote);
    const occupes = ouvertures
      .filter((ouverture) => ouverture.cote === cote)
      .map((ouverture) => [ouverture.position, ouverture.position + ouverture.largeur])
      .sort((a, b) => a[0] - b[0]);
    let debut = Math.min(10, longueur / 2);
    for (const [gauche, droite] of [...occupes, [Math.max(longueur - 10, longueur / 2), longueur]]) {
      if (gauche - debut > meilleur.fin - meilleur.debut) meilleur = { cote, debut, fin: gauche };
      debut = Math.max(debut, droite);
    }
  }
  const libre = meilleur.fin - meilleur.debut;
  return { cote: meilleur.cote, position: Math.max(0, Math.round(meilleur.debut + (libre - largeur) / 2)) };
}

// Remplace la valeur des champs manuels par celle du plan, quand le plan contient des ouvertures.
// Les champs concernés déclarent remplacePar: 'surfaceOuvertures' (ou une autre valeur de VALEURS_OUVERTURES).
export function appliquerOuvertures(champs, valeurs, plan) {
  if (!plan?.ouvertures?.length) return valeurs;
  const resultat = { ...valeurs };
  for (const champ of champs) {
    if (champ.remplacePar && Number.isFinite(plan[champ.remplacePar])) resultat[champ.id] = plan[champ.remplacePar];
  }
  return resultat;
}
