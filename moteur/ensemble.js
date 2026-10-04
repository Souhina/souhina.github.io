// moteur/ensemble.js
// Plan d'ensemble : les pièces du chantier posées les unes à côté des autres.
// Chaque pièce garde son plan propre (cotes intérieures, en cm) ; le plan d'ensemble ne stocke que sa
// position : { x, y, rotation } (rotation en quarts de tour, 0 à 3, autour de l'origine de la pièce).
// Module pur, sans DOM : utilisé par l'éditeur de plan et par test.js.

import { contourExterieur, normaliserMurs } from './murs.js';

const ECART_PAR_DEFAUT = 100; // cm entre deux pièces posées automatiquement

export function normaliserPosition(position) {
  if (!position || !Number.isFinite(Number(position.x)) || !Number.isFinite(Number(position.y))) return null;
  const rotation = ((Math.round(Number(position.rotation) || 0) % 4) + 4) % 4;
  return { x: Math.round(Number(position.x)), y: Math.round(Number(position.y)), rotation };
}

// Point local → point du plan d'ensemble : rotation par quarts de tour, puis translation.
export function versEnsemble([x, y], position) {
  let px = x;
  let py = y;
  for (let k = 0; k < position.rotation; k++) [px, py] = [-py, px];
  return [px + position.x, py + position.y];
}

// Géométrie d'une pièce dans le plan d'ensemble : contour intérieur, contour extérieur (murs) et murs.
export function geometrie(piece, position) {
  const murs = normaliserMurs(piece.murs, piece.points.length);
  const interieur = piece.points.map((point) => versEnsemble(point, position));
  return { interieur, exterieur: contourExterieur(interieur, murs), murs };
}

const boite = (points) => {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
};

// Pièces sans position : posées en ligne à droite des autres, à 1 m d'écart entre les murs, le haut des
// murs aligné sur celui des pièces déjà posées. La première pièce reste à l'origine de son plan.
export function disposer(pieces) {
  const positions = new Map();
  let droite = null;
  let haut = null;
  for (const piece of pieces) {
    const position = normaliserPosition(piece.position);
    if (position) {
      positions.set(piece.id, position);
      const b = boite(geometrie(piece, position).exterieur);
      droite = droite === null ? b.maxX : Math.max(droite, b.maxX);
      haut = haut === null ? b.minY : Math.min(haut, b.minY);
    }
  }
  for (const piece of pieces) {
    if (positions.has(piece.id)) continue;
    const local = boite(geometrie(piece, { x: 0, y: 0, rotation: 0 }).exterieur);
    const x = droite === null ? 0 : droite + ECART_PAR_DEFAUT - local.minX;
    const y = haut === null ? 0 : haut - local.minY;
    positions.set(piece.id, { x: Math.round(x), y: Math.round(y), rotation: 0 });
    droite = x + local.maxX;
    if (haut === null) haut = y + local.minY;
  }
  return positions;
}

// Aimantation : quand un côté de la pièce déplacée fait face au côté d'une autre pièce, à une distance
// proche de l'épaisseur du mur qui les sépare (le plus épais des deux murs déclarés), la pièce est
// recalée à cette distance exacte ; si leurs extrémités sont proches, elles sont aussi alignées.
// Renvoie la position corrigée et la paire de côtés aimantés (ou null).
export function aimanter(piece, position, autres, seuil) {
  const mobile = geometrie(piece, position);
  let meilleur = null;
  for (const autre of autres) {
    const fixe = geometrie(autre.piece, autre.position);
    mobile.interieur.forEach((a, i) => {
      const b = mobile.interieur[(i + 1) % mobile.interieur.length];
      const longueur = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!longueur) return;
      const u = [(b[0] - a[0]) / longueur, (b[1] - a[1]) / longueur];
      const n = sortante(mobile.interieur, i);
      fixe.interieur.forEach((c, j) => {
        const d = fixe.interieur[(j + 1) % fixe.interieur.length];
        const m = sortante(fixe.interieur, j);
        // Côtés face à face : normales sortantes opposées.
        if (n[0] * m[0] + n[1] * m[1] > -0.999) return;
        const ecart = (c[0] - a[0]) * n[0] + (c[1] - a[1]) * n[1];
        const cible = Math.max(mobile.murs[i].epaisseur, fixe.murs[j].epaisseur);
        const erreur = ecart - cible;
        if (Math.abs(erreur) > seuil) return;
        // Les deux côtés doivent se recouvrir le long du mur.
        const t1 = (c[0] - a[0]) * u[0] + (c[1] - a[1]) * u[1];
        const t2 = (d[0] - a[0]) * u[0] + (d[1] - a[1]) * u[1];
        if (Math.max(t1, t2) <= 0 || Math.min(t1, t2) >= longueur) return;
        if (!meilleur || Math.abs(erreur) < Math.abs(meilleur.erreur)) {
          // Alignement des extrémités le long du mur, si l'une est proche d'une autre.
          const decalages = [t1, t2, t1 - longueur, t2 - longueur];
          const alignement = decalages.reduce((retenu, valeur) => (Math.abs(valeur) < Math.abs(retenu) ? valeur : retenu), Infinity);
          meilleur = { erreur, n, u, alignement: Math.abs(alignement) <= seuil ? alignement : 0, avec: autre.piece.id, cote: i, coteAutre: j };
        }
      });
    });
  }
  if (!meilleur) return { position, aimant: null };
  return {
    position: {
      ...position,
      x: Math.round(position.x + meilleur.n[0] * meilleur.erreur + meilleur.u[0] * meilleur.alignement),
      y: Math.round(position.y + meilleur.n[1] * meilleur.erreur + meilleur.u[1] * meilleur.alignement),
    },
    aimant: { avec: meilleur.avec, cote: meilleur.cote, coteAutre: meilleur.coteAutre },
  };
}

// Normale sortante du côté i d'un polygone (sens du tracé pris en compte).
function sortante(points, i) {
  const n = points.length;
  let aireSignee = 0;
  for (let k = 0; k < n; k++) aireSignee += points[k][0] * points[(k + 1) % n][1] - points[(k + 1) % n][0] * points[k][1];
  const sens = aireSignee > 0 ? 1 : -1;
  const [ax, ay] = points[i];
  const [bx, by] = points[(i + 1) % n];
  const longueur = Math.hypot(bx - ax, by - ay) || 1;
  return [(sens * (by - ay)) / longueur, (sens * -(bx - ax)) / longueur];
}

// Point strictement à l'intérieur d'un polygone (règle du rayon), à 1 cm des bords près.
function interieurStrict([px, py], polygone) {
  const n = polygone.length;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = polygone[i];
    const [bx, by] = polygone[(i + 1) % n];
    const longueur = Math.hypot(bx - ax, by - ay) || 1;
    const distance = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / longueur;
    const t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / (longueur * longueur);
    if (distance < 1 && t >= -0.01 && t <= 1.01) return false;
  }
  let dedans = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygone[i];
    const [xj, yj] = polygone[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

// Deux segments se coupent franchement (un contact ou un recouvrement le long d'un bord ne compte pas).
function croisement(a, b, c, d) {
  const produit = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const d1 = produit(c, d, a);
  const d2 = produit(c, d, b);
  const d3 = produit(a, b, c);
  const d4 = produit(a, b, d);
  return ((d1 > 1e-6 && d2 < -1e-6) || (d1 < -1e-6 && d2 > 1e-6)) && ((d3 > 1e-6 && d4 < -1e-6) || (d3 < -1e-6 && d4 > 1e-6));
}

// Chevauchement : l'intérieur d'une pièce empiète sur une autre pièce, murs compris.
// Deux pièces qui partagent un mur à la bonne distance ne se chevauchent pas.
function empiete(interieur, autreExterieur) {
  for (let i = 0; i < interieur.length; i++) {
    for (let j = 0; j < autreExterieur.length; j++) {
      if (croisement(interieur[i], interieur[(i + 1) % interieur.length], autreExterieur[j], autreExterieur[(j + 1) % autreExterieur.length])) return true;
    }
  }
  if (interieur.some((point) => interieurStrict(point, autreExterieur))) return true;
  // Pièce entièrement contenue dans l'autre : on teste aussi le milieu de la pièce.
  const centre = interieur.reduce((s, p) => [s[0] + p[0] / interieur.length, s[1] + p[1] / interieur.length], [0, 0]);
  return interieurStrict(centre, autreExterieur);
}

export function chevauchements(pieces, positions) {
  const geometries = pieces.map((piece) => ({ piece, ...geometrie(piece, positions.get(piece.id)) }));
  const paires = [];
  for (let i = 0; i < geometries.length; i++) {
    for (let j = i + 1; j < geometries.length; j++) {
      const a = geometries[i];
      const b = geometries[j];
      if (empiete(a.interieur, b.exterieur) || empiete(b.interieur, a.exterieur)) paires.push([a.piece.id, b.piece.id]);
    }
  }
  return paires;
}
