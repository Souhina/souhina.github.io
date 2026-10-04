// moteur/chantier.js
// Chantier : plusieurs pièces, chacune avec son plan, ses ouvertures et sa hauteur sous plafond.
// Module pur : la lecture du stockage lui est passée en paramètre, pour être testable sans navigateur.
//
// Format (clé chantier-v1) :
// { version: 1, active: 'id', pieces: [{ id, nom, hauteur (m), points ([x, y] en cm), ouvertures, murs }] }
// murs : un par côté, { type, epaisseur (cm) } ; une pièce enregistrée sans murs reçoit des cloisons.
// position : { x, y, rotation } dans le plan d'ensemble ; absente, la pièce est posée automatiquement.
// niveau : id d'un niveau du chantier (niveaux: [{ id, nom }]) ; elements : trémies, gaines… à déduire.

import { estSimple } from './geometrie.js';
import { normaliserOuvertures } from './ouvertures.js';
import { normaliserMurs } from './murs.js';
import { normaliserPosition } from './ensemble.js';
import { normaliserNiveaux, normaliserElements } from './chantier-plan.js';
import { T } from './langue.js';

export const CLE_CHANTIER = 'chantier-v1';
export const HAUTEUR_PAR_DEFAUT = 2.5;
const CLE_PLAN_V2 = 'plan-piece-v2';
const CLE_PLAN_V1 = 'plan-piece-v1';

export const PLAN_PAR_DEFAUT = [[0, 0], [400, 0], [400, 300], [0, 300]];

const pointsValides = (points) =>
  Array.isArray(points) && points.length >= 3 && points.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) && estSimple(points);

export function identifiantPiece() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function creerPiece(nom, points = PLAN_PAR_DEFAUT, ouvertures = [], hauteur = HAUTEUR_PAR_DEFAUT, murs = [], niveau = undefined, elements = [], nature = 'piece') {
  return {
    ...(nature !== 'piece' ? { nature } : {}),
    ...(niveau ? { niveau } : {}),
    elements: normaliserElements(elements),
    id: identifiantPiece(),
    nom,
    hauteur,
    points: points.map((point) => [...point]),
    ouvertures: ouvertures.map((ouverture) => ({ ...ouverture })),
    murs: normaliserMurs(murs, points.length),
  };
}

// Nettoie une pièce lue dans le stockage ; renvoie null si elle est inutilisable.
function normaliserPiece(piece) {
  if (!piece || !pointsValides(piece.points)) return null;
  const hauteur = Number(piece.hauteur);
  return {
    id: typeof piece.id === 'string' && piece.id ? piece.id.slice(0, 40) : identifiantPiece(),
    nom: String(piece.nom ?? '').trim().slice(0, 60) || T().pieces.nomParDefaut,
    hauteur: hauteur > 0 && hauteur <= 20 ? hauteur : HAUTEUR_PAR_DEFAUT,
    points: piece.points.map((point) => [...point]),
    ouvertures: normaliserOuvertures(piece.ouvertures, piece.points),
    murs: normaliserMurs(piece.murs, piece.points.length),
    elements: normaliserElements(piece.elements),
    ...(natureDe(piece) !== 'piece' ? { nature: natureDe(piece) } : {}),
    ...(typeof piece.niveau === 'string' ? { niveau: piece.niveau.slice(0, 40) } : {}),
    ...(normaliserPosition(piece.position) ? { position: normaliserPosition(piece.position) } : {}),
  };
}

// Lit le chantier : format actuel, sinon migration d'un plan enregistré par une version
// précédente (v2 avec ouvertures, v1 sans), qui devient « Pièce 1 ». Sinon, une pièce par défaut.
// lire(cle) renvoie la chaîne stockée ou null.
export function chargerChantier(lire) {
  const lireJson = (cle) => {
    try {
      return JSON.parse(lire(cle));
    } catch {
      return null;
    }
  };

  const chantier = lireJson(CLE_CHANTIER);
  if (chantier && Array.isArray(chantier.pieces)) {
    const pieces = chantier.pieces.map(normaliserPiece).filter(Boolean).slice(0, 50);
    if (pieces.length) {
      const pieces_ = pieces.filter((piece) => natureDe(piece) === 'piece');
      const active = pieces_.some((piece) => piece.id === chantier.active) ? chantier.active : (pieces_[0] ?? pieces[0]).id;
      const actives = Object.fromEntries(Object.entries(chantier.actives ?? {})
        .filter(([nature, id]) => NATURES.includes(nature) && nature !== 'piece' && pieces.some((piece) => piece.id === id && natureDe(piece) === nature)));
      return { version: 1, active, actives, niveaux: normaliserNiveaux(chantier.niveaux), pieces };
    }
  }

  const planV2 = lireJson(CLE_PLAN_V2);
  const planV1 = lireJson(CLE_PLAN_V1);
  const ancien = pointsValides(planV2?.points)
    ? { points: planV2.points, ouvertures: planV2.ouvertures }
    : pointsValides(planV1)
      ? { points: planV1, ouvertures: [] }
      : { points: PLAN_PAR_DEFAUT, ouvertures: [] };
  const piece = normaliserPiece({ ...creerPiece(T().pieces.premiere), ...ancien });
  return { version: 1, active: piece.id, niveaux: normaliserNiveaux(), pieces: [piece] };
}

// Nature d'un objet du chantier : pièce (plan intérieur), zone extérieure (dalle, terrasse, allée),
// mur (face vue en élévation) ou pan de toit. Chaque nature a son objet actif : chantier.active pour
// les pièces, chantier.actives[nature] pour les autres.
export const NATURES = ['piece', 'zone', 'mur', 'pan'];
export const natureDe = (piece) => (NATURES.includes(piece?.nature) ? piece.nature : 'piece');

export function idActif(chantier, nature = 'piece') {
  return nature === 'piece' ? chantier.active : chantier.actives?.[nature];
}

export function definirActive(chantier, id, nature = 'piece') {
  if (nature === 'piece') chantier.active = id;
  else chantier.actives = { ...(chantier.actives ?? {}), [nature]: id };
}

export function pieceActive(chantier, nature = 'piece') {
  const memeNature = chantier.pieces.filter((piece) => natureDe(piece) === nature);
  const id = idActif(chantier, nature);
  return memeNature.find((piece) => piece.id === id) ?? memeNature[0] ?? chantier.pieces[0];
}

// Premier nom libre de la forme « Pièce N ».
export function nomLibre(chantier, base = T().pieces.nomParDefaut, nature = 'piece') {
  const noms = new Set(chantier.pieces.map((piece) => piece.nom));
  let numero = chantier.pieces.filter((piece) => natureDe(piece) === nature).length + 1;
  while (noms.has(`${base} ${numero}`)) numero++;
  return `${base} ${numero}`;
}
