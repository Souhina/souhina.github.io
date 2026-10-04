// moteur/geometrie.js
// Fonctions géométriques pures, en centimètres.
// Un polygone est un tableau de points [x, y] ; le dernier point est relié au premier.
// Utilisé dans le navigateur (plan, calculateurs) et par test.js.

const EPSILON = 1e-9;

// Aire par la formule du lacet (shoelace), en cm².
export function aire(points) {
  let somme = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    somme += x1 * y2 - x2 * y1;
  }
  return Math.abs(somme) / 2;
}

// Périmètre, en cm.
export function perimetre(points) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    total += Math.hypot(x2 - x1, y2 - y1);
  }
  return total;
}

function orientation(a, b, c) {
  const produit = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(produit) < EPSILON) return 0;
  return produit > 0 ? 1 : -1;
}

function surSegment(a, b, c) {
  return (
    Math.min(a[0], b[0]) - EPSILON <= c[0] && c[0] <= Math.max(a[0], b[0]) + EPSILON &&
    Math.min(a[1], b[1]) - EPSILON <= c[1] && c[1] <= Math.max(a[1], b[1]) + EPSILON
  );
}

export function segmentsSeCroisent(p1, p2, p3, p4) {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && surSegment(p1, p2, p3)) return true;
  if (o2 === 0 && surSegment(p1, p2, p4)) return true;
  if (o3 === 0 && surSegment(p3, p4, p1)) return true;
  if (o4 === 0 && surSegment(p3, p4, p2)) return true;
  return false;
}

// Vrai si le polygone est utilisable : au moins 3 angles, pas d'angles superposés,
// pas de côtés qui se croisent, aire non nulle.
export function estSimple(points) {
  const n = points.length;
  if (n < 3) return false;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (points[i][0] === points[j][0] && points[i][1] === points[j][1]) return false;
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const adjacents = j === i + 1 || (i === 0 && j === n - 1);
      if (adjacents) continue;
      if (segmentsSeCroisent(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return false;
    }
  }

  return aire(points) > EPSILON;
}

export function tourner(points, angleDegres) {
  const angle = (angleDegres * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
}

// Découpe d'un polygone par un demi-plan (étape de l'algorithme de Sutherland-Hodgman).
// axe : 0 pour x, 1 pour y ; sens : 1 garde coordonnée >= limite, -1 garde coordonnée <= limite.
function couperDemiPlan(polygone, axe, limite, sens) {
  const resultat = [];
  const dedans = (point) => sens * (point[axe] - limite) >= -EPSILON;

  for (let i = 0; i < polygone.length; i++) {
    const a = polygone[i];
    const b = polygone[(i + 1) % polygone.length];
    const aDedans = dedans(a);
    const bDedans = dedans(b);
    if (aDedans) resultat.push(a);
    if (aDedans !== bDedans) {
      const t = (limite - a[axe]) / (b[axe] - a[axe]);
      resultat.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return resultat;
}

// Partie du polygone contenue dans un rectangle { x0, y0, x1, y1 }.
// Le polygone peut être concave (pièce en L) : l'aire du résultat reste exacte.
export function decouper(polygone, rectangle) {
  let morceau = polygone;
  morceau = couperDemiPlan(morceau, 0, rectangle.x0, 1);
  if (morceau.length) morceau = couperDemiPlan(morceau, 0, rectangle.x1, -1);
  if (morceau.length) morceau = couperDemiPlan(morceau, 1, rectangle.y0, 1);
  if (morceau.length) morceau = couperDemiPlan(morceau, 1, rectangle.y1, -1);
  return morceau;
}

// Pose virtuelle des carreaux sur le plan, depuis l'angle haut gauche de la forme.
// largeur et longueur du carreau en cm, joint en cm.
// type : 'droite', 'decalee' (decalage = fraction de carreau : 0.5, 1/3…) ou 'diagonale'.
// Retourne le nombre de carreaux entiers, de coupes, et une estimation des carreaux
// nécessaires aux coupes en réutilisant les chutes (deux petites coupes par carreau).
export function calepiner(points, { largeur, longueur, joint = 0, type = 'droite', decalage = 0.5 }) {
  if (!(largeur > 0 && longueur > 0) || joint < 0 || !estSimple(points)) return null;

  const forme = type === 'diagonale' ? tourner(points, 45) : points;
  const xs = forme.map((point) => point[0]);
  const ys = forme.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const pasX = largeur + joint;
  const pasY = longueur + joint;
  const estimation = ((maxX - minX) / pasX + 2) * ((maxY - minY) / pasY + 1);
  if (estimation > 200000) return null; // format trop petit pour la surface : calcul trop long

  const aireCarreau = largeur * longueur;
  let entiers = 0;
  const coupes = [];

  for (let rangee = 0, y = minY; y < maxY - EPSILON; rangee++, y += pasY) {
    const decalageRangee = type === 'decalee' ? ((rangee * decalage) % 1) * pasX : 0;
    for (let x = minX - decalageRangee; x < maxX - EPSILON; x += pasX) {
      const morceau = decouper(forme, { x0: x, y0: y, x1: x + largeur, y1: y + longueur });
      if (morceau.length < 3) continue;
      const ratio = aire(morceau) / aireCarreau;
      if (ratio >= 0.999) entiers++;
      else if (ratio > 0.001) coupes.push(ratio);
    }
  }

  const grandesCoupes = coupes.filter((ratio) => ratio > 0.5).length;
  const petitesCoupes = coupes.length - grandesCoupes;

  return {
    entiers,
    coupes: coupes.length,
    carreauxPourCoupes: grandesCoupes + Math.ceil(petitesCoupes / 2),
  };
}
