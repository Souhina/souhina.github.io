// moteur/chantier-plan.js
// Le chantier assemblé : niveaux, éléments à déduire, murs communs entre pièces voisines,
// ouvertures partagées, retours de tableau et mesures d'ensemble.
// Module pur, sans DOM : utilisé par l'éditeur de plan, par calcul.js et par test.js.

import { aire, perimetre } from './geometrie.js';
import { normaliserOuvertures, totauxOuvertures } from './ouvertures.js';
import { normaliserMurs, totauxMurs } from './murs.js';
import { disposer, geometrie } from './ensemble.js';

// --- Niveaux ---------------------------------------------------------------------------------

export const NIVEAU_PAR_DEFAUT = { id: 'n0', nom: 'Rez-de-chaussée' };

export function normaliserNiveaux(niveaux) {
  const liste = (Array.isArray(niveaux) ? niveaux : [])
    .filter((niveau) => niveau && typeof niveau.id === 'string' && niveau.id)
    .map((niveau) => ({ id: niveau.id.slice(0, 40), nom: String(niveau.nom ?? '').trim().slice(0, 60) || NIVEAU_PAR_DEFAUT.nom }));
  return liste.length ? liste : [{ ...NIVEAU_PAR_DEFAUT }];
}

// Niveau d'une pièce : le sien s'il existe encore, sinon le premier niveau du chantier.
export function niveauDe(piece, chantier) {
  const niveaux = normaliserNiveaux(chantier.niveaux);
  return niveaux.some((niveau) => niveau.id === piece.niveau) ? piece.niveau : niveaux[0].id;
}

// --- Éléments à déduire (trémie d'escalier, gaine, conduit…) ---------------------------------

// Dimensions courantes proposées, en cm, à vérifier sur place.
export const TYPES_ELEMENT = {
  tremie: { largeur: 90, longueur: 250 },
  gaine: { largeur: 40, longueur: 40 },
  conduit: { largeur: 50, longueur: 50 },
  regard: { largeur: 50, longueur: 50 },
  porte: { largeur: 83, longueur: 204 },
  fenetre: { largeur: 120, longueur: 135 },
  fenetreToit: { largeur: 78, longueur: 98 },
  cheminee: { largeur: 60, longueur: 60 },
  autre: { largeur: 50, longueur: 50 },
};
// Éléments proposés selon la nature de l'objet dessiné (pour un mur, ce sont ses ouvertures).
export const ELEMENTS_PAR_NATURE = {
  piece: ['tremie', 'gaine', 'conduit', 'autre'],
  zone: ['regard', 'autre'],
  mur: ['porte', 'fenetre', 'autre'],
  pan: ['fenetreToit', 'cheminee', 'autre'],
};
const natureDe = (piece) => (['zone', 'mur', 'pan'].includes(piece?.nature) ? piece.nature : 'piece');

// Rectangle placé dans la pièce : { type, x, y, largeur, longueur } en cm (x, y : coin de départ).
export function normaliserElements(liste) {
  return (Array.isArray(liste) ? liste : [])
    .filter((element) => element && TYPES_ELEMENT[element.type])
    .slice(0, 20)
    .map((element) => ({
      type: element.type,
      x: Math.round(Number(element.x) || 0),
      y: Math.round(Number(element.y) || 0),
      // Dimension absente ou invalide (moins de 1 cm) : dimension courante du type.
      largeur: Number(element.largeur) >= 1 ? Math.round(Number(element.largeur)) : TYPES_ELEMENT[element.type].largeur,
      longueur: Number(element.longueur) >= 1 ? Math.round(Number(element.longueur)) : TYPES_ELEMENT[element.type].longueur,
    }));
}

// --- Murs communs ----------------------------------------------------------------------------

const normaleSortante = (points, i) => {
  const n = points.length;
  let aireSignee = 0;
  for (let k = 0; k < n; k++) aireSignee += points[k][0] * points[(k + 1) % n][1] - points[(k + 1) % n][0] * points[k][1];
  const sens = aireSignee > 0 ? 1 : -1;
  const [ax, ay] = points[i];
  const [bx, by] = points[(i + 1) % n];
  const longueur = Math.hypot(bx - ax, by - ay) || 1;
  return [(sens * (by - ay)) / longueur, (sens * -(bx - ax)) / longueur];
};

// Deux côtés de pièces d'un même niveau forment un mur commun quand ils se font face, à l'épaisseur
// du mur près (1 cm), sur une longueur commune. Résultat : pour chaque mur commun, la portion de
// chaque côté concernée (en cm depuis l'angle de départ du côté), la longueur et l'épaisseur.
export function mursCommuns(chantier) {
  const pieces = chantier.pieces.filter((piece) => natureDe(piece) === 'piece');
  const positions = disposer(pieces);
  const formes = pieces.map((piece) => ({ piece, niveau: niveauDe(piece, chantier), ...geometrie(piece, positions.get(piece.id)) }));
  const communs = [];
  for (let p = 0; p < formes.length; p++) {
    for (let q = p + 1; q < formes.length; q++) {
      const A = formes[p];
      const B = formes[q];
      if (A.niveau !== B.niveau) continue;
      A.interieur.forEach((a, i) => {
        const b = A.interieur[(i + 1) % A.interieur.length];
        const longueurA = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (!longueurA) return;
        const u = [(b[0] - a[0]) / longueurA, (b[1] - a[1]) / longueurA];
        const n = normaleSortante(A.interieur, i);
        B.interieur.forEach((c, j) => {
          const d = B.interieur[(j + 1) % B.interieur.length];
          const m = normaleSortante(B.interieur, j);
          if (n[0] * m[0] + n[1] * m[1] > -0.999) return;
          const epaisseur = Math.max(A.murs[i].epaisseur, B.murs[j].epaisseur);
          const ecart = (c[0] - a[0]) * n[0] + (c[1] - a[1]) * n[1];
          if (Math.abs(ecart - epaisseur) > 1) return;
          const t1 = (c[0] - a[0]) * u[0] + (c[1] - a[1]) * u[1];
          const t2 = (d[0] - a[0]) * u[0] + (d[1] - a[1]) * u[1];
          const debut = Math.max(0, Math.min(t1, t2));
          const fin = Math.min(longueurA, Math.max(t1, t2));
          if (fin - debut < 1) return;
          // Même portion, exprimée le long du côté de B (de c vers d).
          const longueurB = Math.hypot(d[0] - c[0], d[1] - c[1]);
          const v = [(d[0] - c[0]) / longueurB, (d[1] - c[1]) / longueurB];
          const surB = (t) => {
            const point = [a[0] + u[0] * t, a[1] + u[1] * t];
            return (point[0] - c[0]) * v[0] + (point[1] - c[1]) * v[1];
          };
          const b1 = surB(debut);
          const b2 = surB(fin);
          communs.push({
            a: { piece: A.piece.id, cote: i, debut, fin },
            b: { piece: B.piece.id, cote: j, debut: Math.min(b1, b2), fin: Math.max(b1, b2) },
            longueur: fin - debut,
            epaisseur,
            cloison: A.murs[i].type === 'cloison' && B.murs[j].type === 'cloison',
          });
        });
      });
    }
  }
  return communs;
}

// --- Informations d'une pièce, dans le contexte du chantier ----------------------------------

// Retours de tableau d'une ouverture dans un mur épais (mur extérieur ou porteur), en m² :
// les deux côtés et le dessus ; l'appui en plus pour une fenêtre. Profondeur = épaisseur du mur.
function surfaceTableaux(ouverture, epaisseur) {
  const pourtour = 2 * ouverture.hauteur + ouverture.largeur + (ouverture.type === 'fenetre' ? ouverture.largeur : 0);
  return (epaisseur * pourtour) / 10000;
}

// Le plan d'une pièce tel que le reçoivent les calculateurs : surfaces (nette des éléments déduits),
// ouvertures (les siennes et celles des pièces voisines sur un mur commun), murs et retours de tableau.
// Zone extérieure, face de mur ou pan de toit : un polygone et des éléments à déduire.
// longueur et hauteur : dimensions hors tout du dessin (m) ; pour un mur, la longueur est horizontale.
function infosSurface(piece, chantier) {
  const points = piece.points;
  const elements = normaliserElements(piece.elements);
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const surfaceBrute = aire(points) / 10000;
  const surfaceElements = elements.reduce((total, element) => total + (element.largeur * element.longueur) / 10000, 0);
  const compte = (type) => elements.filter((element) => element.type === type).length;
  return {
    valide: true,
    nature: natureDe(piece),
    points: points.map((point) => [...point]),
    surfaceBrute,
    surface: Math.max(0, surfaceBrute - surfaceElements),
    surfaceElements: Math.round(surfaceElements * 10000) / 10000,
    perimetre: perimetre(points) / 100,
    longueur: (Math.max(...xs) - Math.min(...xs)) / 100,
    largeur: (Math.max(...ys) - Math.min(...ys)) / 100,
    hauteur: (Math.max(...ys) - Math.min(...ys)) / 100,
    elements,
    nombreElements: elements.length,
    nombrePortes: compte('porte'),
    nombreFenetres: compte('fenetre'),
    ouvertures: [],
    piece: { id: piece.id, nom: piece.nom, hauteur: piece.hauteur, niveau: niveauDe(piece, chantier), nature: natureDe(piece) },
  };
}

export function infosPiece(piece, chantier, communs = mursCommuns(chantier)) {
  if (natureDe(piece) !== 'piece') return infosSurface(piece, chantier);
  const points = piece.points;
  const murs = normaliserMurs(piece.murs, points.length);
  const propres = normaliserOuvertures(piece.ouvertures, points);
  const elements = normaliserElements(piece.elements);

  // Ouvertures partagées : celles de la pièce voisine, reportées sur la portion du mur commun.
  const partagees = [];
  const mursPartages = murs.map(() => 0);
  for (const commun of communs) {
    const ici = commun.a.piece === piece.id ? commun.a : commun.b.piece === piece.id ? commun.b : null;
    if (!ici) continue;
    const la = ici === commun.a ? commun.b : commun.a;
    mursPartages[ici.cote] += commun.longueur / 100;
    const voisine = chantier.pieces.find((element) => element.id === la.piece);
    for (const ouverture of normaliserOuvertures(voisine?.ouvertures, voisine?.points ?? [])) {
      if (ouverture.cote !== la.cote) continue;
      const debutVoisin = Math.max(ouverture.position, la.debut);
      const finVoisin = Math.min(ouverture.position + ouverture.largeur, la.fin);
      if (finVoisin - debutVoisin < 1) continue;
      // Les deux côtés sont parcourus en sens opposés : la position se lit depuis l'autre extrémité.
      const position = ici.debut + (la.fin - finVoisin);
      partagees.push({ ...ouverture, cote: ici.cote, position: Math.round(position), largeur: Math.round(finVoisin - debutVoisin), partagee: true });
    }
  }
  const ouvertures = [...propres, ...partagees];

  const tableaux = propres.reduce((total, ouverture) => {
    const mur = murs[ouverture.cote];
    return mur.type === 'cloison' ? total : total + surfaceTableaux(ouverture, mur.epaisseur);
  }, 0);
  const surfaceBrute = aire(points) / 10000;
  const surfaceElements = elements.reduce((total, element) => total + (element.largeur * element.longueur) / 10000, 0);

  return {
    valide: true,
    points: points.map((point) => [...point]),
    surfaceBrute,
    surface: Math.max(0, surfaceBrute - surfaceElements),
    surfaceElements: Math.round(surfaceElements * 10000) / 10000,
    perimetre: perimetre(points) / 100,
    // Dimensions hors tout du dessin (m), pour les calculs qui ont besoin d'un sens (solives, lames).
    longueur: (Math.max(...points.map((point) => point[0])) - Math.min(...points.map((point) => point[0]))) / 100,
    largeur: (Math.max(...points.map((point) => point[1])) - Math.min(...points.map((point) => point[1]))) / 100,
    ouvertures,
    ...totauxOuvertures(ouvertures),
    murs: murs.map((mur, i) => ({
      ...mur,
      longueur: Math.round(Math.hypot(points[(i + 1) % points.length][0] - points[i][0], points[(i + 1) % points.length][1] - points[i][1])) / 100,
      partage: Math.round(mursPartages[i] * 100) / 100,
    })),
    ...totauxMurs(points, murs),
    surfaceTableaux: Math.round(tableaux * 10000) / 10000,
    elements,
    piece: { id: piece.id, nom: piece.nom, hauteur: piece.hauteur, niveau: niveauDe(piece, chantier) },
  };
}

// Pièces concernées par un calcul : la pièce active, son niveau, ou tout le chantier.
export function piecesDePortee(chantier, portee, idActive) {
  const active = chantier.pieces.find((piece) => piece.id === idActive) ?? chantier.pieces[0];
  const memeNature = chantier.pieces.filter((piece) => natureDe(piece) === natureDe(active));
  if (portee === 'chantier') return memeNature;
  if (portee === 'niveau') return memeNature.filter((piece) => niveauDe(piece, chantier) === niveauDe(active, chantier));
  return [active];
}

// --- Mesures d'ensemble ----------------------------------------------------------------------

// Pour un niveau (ou tout le chantier si niveau est omis) :
// - surface habitable : somme des surfaces nettes des pièces ;
// - emprise au sol : pièces murs compris, sans compter deux fois les murs communs ;
// - longueur de façades : longueur extérieure des murs extérieurs qui ne sont pas communs ;
// - longueur de cloisons : chaque cloison commune comptée une seule fois ;
// - retours de tableau des murs extérieurs, à enduire ou à peindre côté façade.
export function mesures(chantier, niveau = null) {
  const communs = mursCommuns(chantier);
  const positions = disposer(chantier.pieces.filter((piece) => natureDe(piece) === 'piece'));
  const pieces = chantier.pieces.filter((piece) => natureDe(piece) === 'piece' && (niveau === null || niveauDe(piece, chantier) === niveau));
  const ids = new Set(pieces.map((piece) => piece.id));
  let surfaceHabitable = 0;
  let emprise = 0;
  let longueurFacades = 0;
  let longueurCloisons = 0;
  let tableauxExterieurs = 0;
  for (const piece of pieces) {
    const infos = infosPiece(piece, chantier, communs);
    surfaceHabitable += infos.surface;
    const forme = geometrie(piece, positions.get(piece.id));
    emprise += aire(forme.exterieur) / 10000;
    infos.murs.forEach((mur, i) => {
      if (mur.type === 'exterieur' && mur.partage === 0) {
        const a = forme.exterieur[i];
        const b = forme.exterieur[(i + 1) % forme.exterieur.length];
        longueurFacades += Math.hypot(b[0] - a[0], b[1] - a[1]) / 100;
      }
      if (mur.type === 'cloison') longueurCloisons += mur.longueur;
    });
    for (const ouverture of normaliserOuvertures(piece.ouvertures, piece.points)) {
      const mur = infos.murs[ouverture.cote];
      if (mur.type === 'exterieur') tableauxExterieurs += surfaceTableaux(ouverture, mur.epaisseur);
    }
  }
  // Murs communs du niveau : bande de mur comptée dans les deux pièces, et cloison comptée deux fois.
  for (const commun of communs) {
    if (!ids.has(commun.a.piece) || !ids.has(commun.b.piece)) continue;
    const pieceA = chantier.pieces.find((piece) => piece.id === commun.a.piece);
    const pieceB = chantier.pieces.find((piece) => piece.id === commun.b.piece);
    const eA = normaliserMurs(pieceA.murs, pieceA.points.length)[commun.a.cote].epaisseur;
    const eB = normaliserMurs(pieceB.murs, pieceB.points.length)[commun.b.cote].epaisseur;
    emprise -= (commun.longueur * Math.min(eA, eB)) / 10000;
    if (commun.cloison) longueurCloisons -= commun.longueur / 100;

    // Aux extrémités du mur commun, les murs voisins des deux pièces se rejoignent : leurs bandes se
    // recouvrent sur l'épaisseur du mur commun. Le début du côté de A correspond à la fin de celui de B.
    const mursA = normaliserMurs(pieceA.murs, pieceA.points.length);
    const mursB = normaliserMurs(pieceB.murs, pieceB.points.length);
    const longueurCoteA = Math.hypot(...[0, 1].map((k) => pieceA.points[(commun.a.cote + 1) % pieceA.points.length][k] - pieceA.points[commun.a.cote][k]));
    const longueurCoteB = Math.hypot(...[0, 1].map((k) => pieceB.points[(commun.b.cote + 1) % pieceB.points.length][k] - pieceB.points[commun.b.cote][k]));
    const extremites = [
      { aBout: commun.a.debut < 1, voisinA: (commun.a.cote - 1 + mursA.length) % mursA.length, bBout: commun.b.fin > longueurCoteB - 1, voisinB: (commun.b.cote + 1) % mursB.length },
      { aBout: commun.a.fin > longueurCoteA - 1, voisinA: (commun.a.cote + 1) % mursA.length, bBout: commun.b.debut < 1, voisinB: (commun.b.cote - 1 + mursB.length) % mursB.length },
    ];
    for (const { aBout, voisinA, bBout, voisinB } of extremites) {
      if (!aBout || !bBout) continue;
      const recouvrement = Math.min(eA, eB);
      emprise -= (recouvrement * Math.min(mursA[voisinA].epaisseur, mursB[voisinB].epaisseur)) / 10000;
      if (mursA[voisinA].type === 'exterieur' && mursB[voisinB].type === 'exterieur') longueurFacades -= recouvrement / 100;
    }
  }
  const arrondi = (valeur) => Math.round(valeur * 100) / 100;
  return {
    nombrePieces: pieces.length,
    surfaceHabitable: arrondi(surfaceHabitable),
    emprise: arrondi(emprise),
    longueurFacades: arrondi(longueurFacades),
    longueurCloisons: arrondi(longueurCloisons),
    surfaceTableauxExterieurs: arrondi(tableauxExterieurs),
  };
}

// Valeurs proposées aux calculateurs sans plan (clé suggestionChantier d'un champ).
export const SUGGESTIONS_CHANTIER = ['longueurFacades', 'longueurCloisons', 'surfaceTableauxExterieurs'];
