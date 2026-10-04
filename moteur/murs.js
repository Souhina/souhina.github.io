// moteur/murs.js
// Murs d'une pièce : un mur par côté du plan (mur i = de l'angle i à l'angle i + 1), avec un type
// et une épaisseur. La pièce reste dessinée à ses cotes intérieures ; les murs s'ajoutent vers
// l'extérieur. Module pur, sans DOM : utilisé par l'éditeur de plan, par chantier.js et par test.js.

import { aire, perimetre } from './geometrie.js';

// Épaisseurs courantes proposées par défaut, en cm, à vérifier selon le bâtiment :
// mur extérieur = maçonnerie de 20 cm et doublage isolé d'environ 10 cm ; mur porteur intérieur
// = maçonnerie de 20 cm ; cloison = plaque sur ossature de 72 mm (cloison 72/48).
export const TYPES_MUR = {
  exterieur: { epaisseur: 30 },
  porteur: { epaisseur: 20 },
  cloison: { epaisseur: 7 },
};
export const TYPE_MUR_PAR_DEFAUT = 'cloison';

const murParDefaut = (type = TYPE_MUR_PAR_DEFAUT) => ({ type, epaisseur: TYPES_MUR[type].epaisseur });

// Nettoie la liste des murs d'une pièce de n côtés : type connu, épaisseur entre 1 et 100 cm ;
// les murs manquants (plan enregistré avant les murs) reçoivent le type par défaut.
export function normaliserMurs(murs, nombreCotes) {
  return Array.from({ length: nombreCotes }, (_, index) => {
    const mur = Array.isArray(murs) ? murs[index] : null;
    const type = TYPES_MUR[mur?.type] ? mur.type : TYPE_MUR_PAR_DEFAUT;
    const epaisseur = Number(mur?.epaisseur);
    return { type, epaisseur: epaisseur >= 1 && epaisseur <= 100 ? Math.round(epaisseur * 10) / 10 : TYPES_MUR[type].epaisseur };
  });
}

// Ajout d'un angle sur le côté « cote » : les deux moitiés gardent le mur d'origine.
export function insererAngleMurs(murs, cote) {
  const copie = murs.map((mur) => ({ ...mur }));
  copie.splice(cote + 1, 0, { ...murs[cote] });
  return copie;
}

// Suppression de l'angle « index » : les deux côtés qui s'y rejoignent n'en font plus qu'un,
// qui garde le mur du côté précédent.
export function supprimerAngleMurs(murs, index) {
  const n = murs.length;
  const precedent = (index - 1 + n) % n;
  const copie = murs.map((mur) => ({ ...mur }));
  copie[precedent] = { ...murs[precedent] };
  copie.splice(index, 1);
  return copie;
}

// Contour extérieur (cm) : chaque côté est décalé vers l'extérieur de l'épaisseur de son mur, et
// les côtés voisins décalés se coupent pour donner l'angle extérieur (angles propres même avec
// des épaisseurs différentes). Deux côtés alignés : simple décalage de l'angle.
export function contourExterieur(points, murs) {
  const n = points.length;
  let aireSignee = 0;
  for (let i = 0; i < n; i++) aireSignee += points[i][0] * points[(i + 1) % n][1] - points[(i + 1) % n][0] * points[i][1];
  const sens = aireSignee > 0 ? 1 : -1;
  // Pour un tracé dans le sens de aireSignee > 0, l'extérieur est à droite de chaque côté.
  const decale = (i) => {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % n];
    const longueur = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (sens * (by - ay)) / longueur;
    const ny = (sens * -(bx - ax)) / longueur;
    const e = murs[i].epaisseur;
    return { a: [ax + nx * e, ay + ny * e], b: [bx + nx * e, by + ny * e], n: [nx, ny] };
  };
  const cotes = Array.from({ length: n }, (_, i) => decale(i));
  return points.map((point, i) => {
    const l1 = cotes[(i - 1 + n) % n];
    const l2 = cotes[i];
    const d1 = [l1.b[0] - l1.a[0], l1.b[1] - l1.a[1]];
    const d2 = [l2.b[0] - l2.a[0], l2.b[1] - l2.a[1]];
    const det = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(det) < 1e-9) return [point[0] + l2.n[0] * murs[i].epaisseur, point[1] + l2.n[1] * murs[i].epaisseur];
    const t = ((l2.a[0] - l1.a[0]) * d2[1] - (l2.a[1] - l1.a[1]) * d2[0]) / det;
    return [l1.a[0] + d1[0] * t, l1.a[1] + d1[1] * t];
  });
}

// Normale unitaire vers l'extérieur du côté i (sens du tracé pris en compte).
export function normaleExterieure(points, i) {
  const n = points.length;
  let aireSignee = 0;
  for (let k = 0; k < n; k++) aireSignee += points[k][0] * points[(k + 1) % n][1] - points[(k + 1) % n][0] * points[k][1];
  const sens = aireSignee > 0 ? 1 : -1;
  const [ax, ay] = points[i];
  const [bx, by] = points[(i + 1) % n];
  const longueur = Math.hypot(bx - ax, by - ay) || 1;
  return [(sens * (by - ay)) / longueur, (sens * -(bx - ax)) / longueur];
}

// Totaux exposés aux calculateurs : longueurs intérieures de murs par type (m), surface et
// périmètre hors tout de la pièce, murs compris.
export function totauxMurs(points, murs) {
  const longueurs = { exterieur: 0, porteur: 0, cloison: 0 };
  points.forEach((point, i) => {
    const suivant = points[(i + 1) % points.length];
    longueurs[murs[i].type] += Math.hypot(suivant[0] - point[0], suivant[1] - point[1]) / 100;
  });
  const exterieur = contourExterieur(points, murs);
  const arrondi = (valeur) => Math.round(valeur * 10000) / 10000;
  return {
    longueurMursExterieurs: arrondi(longueurs.exterieur),
    longueurMursPorteurs: arrondi(longueurs.porteur),
    longueurCloisons: arrondi(longueurs.cloison),
    surfaceHorsTout: arrondi(aire(exterieur) / 10000),
    perimetreHorsTout: arrondi(perimetre(exterieur) / 100),
  };
}
