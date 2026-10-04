// moteur/nombres.js
// Lecture et affichage des nombres selon la langue de la page (français par défaut).
// Utilisé par le navigateur et par test.js.

import { T } from './langue.js';

// Formats Intl mis en cache par langue (locale) et par réglage.
const formats = new Map();
function format(nom, options) {
  const cle = `${T().locale}|${nom}`;
  if (!formats.has(cle)) formats.set(cle, new Intl.NumberFormat(T().locale, options));
  return formats.get(cle);
}
const nombreFr = { format: (valeur) => format('nombre', { maximumFractionDigits: 2 }).format(valeur) };
const pourcentFr = { format: (valeur) => format('pourcent', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valeur) };
const eurosFr = { format: (valeur) => format('euros', { style: 'currency', currency: T().devise }).format(valeur) };

// « texte » : résultat textuel (par exemple la source d'un taux), affiché tel quel.
export const formatsAutorises = ['euros', 'pourcent', 'nombre', 'texte'];

// Convertit une saisie ("1 250,50" en français) en nombre, selon le séparateur décimal de la langue.
// Retourne null si le champ est vide, NaN si la saisie n'est pas un nombre.
export function lireNombre(texte) {
  const sansEspaces = String(texte ?? '').replace(/[\s\u00a0\u202f]/g, '');
  // Virgule décimale (français) : la virgule devient un point. Point décimal : les virgules sont des milliers.
  const nettoye = T().separateurDecimal === ',' ? sansEspaces.replace(',', '.') : sansEspaces.replace(/,/g, '');
  if (nettoye === '') return null;
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(nettoye)) return Number.NaN;
  return Number(nettoye);
}

// Formate une valeur selon le format déclaré ; "unite" s'ajoute au format "nombre".
export function formater(valeur, format = 'nombre', unite = '') {
  // Zéro négatif (arrondi d'un très petit nombre négatif, par exemple Math.ceil(0 − 1e-9)) affiché « 0 », pas « -0 ».
  if (Object.is(valeur, -0)) valeur = 0;
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return '—';
  if (format === 'euros') return eurosFr.format(valeur);
  if (format === 'pourcent') return `${pourcentFr.format(valeur)}\u00a0%`;
  return unite ? `${nombreFr.format(valeur)}\u00a0${unite}` : nombreFr.format(valeur);
}

export function formaterEuros(valeur) {
  return eurosFr.format(Number.isFinite(valeur) ? valeur : 0);
}

// Valeur affichée dans un champ de saisie : séparateur décimal de la langue, sans espace de milliers.
export function versSaisie(valeur) {
  if (!Number.isFinite(valeur)) return '';
  return String(Math.round(valeur * 100) / 100).replace('.', T().separateurDecimal);
}

// --- Équivalents impériaux (affichage seulement : les calculs restent métriques) ---

export const UNITES_CONVERTIBLES = ['m', 'cm', 'mm', 'm²', 'm³', 'kg', 't', 'L'];
const avecDecimales = (decimales) => format(`decimales-${decimales}`, { maximumFractionDigits: decimales });

// Équivalent impérial d'une valeur métrique, ou null si l'unité ne se convertit pas.
// « 12,5 m² » → « 134,5 sq ft » ; « 35 kg » → « 77 lb » ; « 2,5 m » → « 8 ft 2 in » ;
// « 10 L » → « 2,2 gal (UK) » (ou « 2,6 gal (US) » avec { gallon: 'us' }).
export function equivalentImperial(valeur, unite, { gallon = 'uk' } = {}) {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur) || !UNITES_CONVERTIBLES.includes(unite)) return null;
  switch (unite) {
    case 'm':
    case 'cm':
    case 'mm': {
      const pouces = (valeur * { m: 100, cm: 1, mm: 0.1 }[unite]) / 2.54;
      if (unite !== 'm' || Math.abs(pouces) < 12) return `${avecDecimales(1).format(pouces)} in`;
      let pieds = Math.floor(pouces / 12);
      let reste = Math.round(pouces - pieds * 12);
      if (reste === 12) {
        pieds += 1;
        reste = 0;
      }
      return `${avecDecimales(0).format(pieds)} ft ${reste} in`;
    }
    case 'm²':
      return `${avecDecimales(1).format(valeur * 10.7639)} sq ft`;
    case 'm³':
      return `${avecDecimales(2).format(valeur * 1.30795)} cu yd`;
    case 'kg':
    case 't': {
      const livres = valeur * (unite === 't' ? 2204.62 : 2.20462);
      return `${avecDecimales(livres >= 10 ? 0 : 1).format(livres)} lb`;
    }
    case 'L':
      return gallon === 'us'
        ? `${avecDecimales(1).format(valeur / 3.78541)} gal (US)`
        : `${avecDecimales(1).format(valeur / 4.54609)} gal (UK)`;
    default:
      return null;
  }
}

// Réglage de l'internaute, mémorisé dans le navigateur ; désactivé par défaut.
export const CLE_IMPERIAL = 'unites-imperiales-v1';

export function lireReglageImperial() {
  try {
    const reglage = JSON.parse(localStorage.getItem(CLE_IMPERIAL));
    return { actif: reglage?.actif === true, gallon: reglage?.gallon === 'us' ? 'us' : 'uk' };
  } catch {
    return { actif: false, gallon: 'uk' };
  }
}

export function ecrireReglageImperial(reglage) {
  try {
    localStorage.setItem(CLE_IMPERIAL, JSON.stringify({ actif: Boolean(reglage.actif), gallon: reglage.gallon === 'us' ? 'us' : 'uk' }));
  } catch {
    // Stockage indisponible : le réglage vaut pour la page en cours.
  }
}
