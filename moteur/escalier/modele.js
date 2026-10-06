// moteur/escalier/modele.js
// Modèle de configuration d'un escalier : un objet unique, décrit ci-dessous, que le moteur
// géométrique (geometrie.js) transforme en pièces, et que les rendus (rendu.js) dessinent.
// Ajouter une option = ajouter une clé ici (valeur par défaut et bornes), puis la traiter dans
// geometrie.js : le plan, la coupe et les vues suivent sans autre modification.
//
// Toutes les longueurs sont en centimètres. Module pur : utilisable dans Node et le navigateur.

export const VERSION = 1;

// Formes disponibles en V1. Les autres (balancement, demi-tournant, colimaçon…) viendront ensuite.
export const FORMES = ['droit', 'quart-palier'];
export const SENS = ['gauche', 'droite'];
export const STRUCTURES = ['deux-limons', 'limon-central'];

export const DEFAUTS = Object.freeze({
  v: VERSION,
  forme: 'droit',
  sens: 'gauche', // sens du virage, en montant
  hauteur: 270, // à franchir, du sol fini au sol fini
  largeur: 90, // emmarchement
  hauteurVisee: 17.5, // hauteur de marche visée
  blondel: 63, // 2 h + g visé
  giron: null, // giron imposé (sinon déduit de Blondel)
  contremarches: null, // nombre de hauteurs imposé (sinon déduit de la hauteur visée)
  avantPalier: null, // hauteurs avant le palier (quart tournant) ; null = au milieu
  structure: 'deux-limons',
  fermee: false, // marches fermées par des contremarches
  epaisseurMarche: 4,
  debordNez: 3,
  hauteurLimon: 28,
  epaisseurLimon: 5,
  epaisseurPlancher: 25, // plancher haut : du sol fini à la sous-face
  tremieLongueur: null, // null = longueur conseillée par le calcul
  tremieLargeur: null, // null = emmarchement
  echappeeVisee: 190, // repère de confort, pas une obligation en maison individuelle
});

// Bornes des valeurs numériques [min, max]. Une valeur hors bornes est ramenée dans la plage.
export const BORNES = Object.freeze({
  hauteur: [60, 600],
  largeur: [50, 200],
  hauteurVisee: [12, 22],
  blondel: [56, 68],
  giron: [15, 40],
  contremarches: [3, 40],
  avantPalier: [1, 39],
  epaisseurMarche: [1, 10],
  debordNez: [0, 6],
  hauteurLimon: [15, 45],
  epaisseurLimon: [3, 15],
  epaisseurPlancher: [10, 60],
  tremieLongueur: [40, 1000],
  tremieLargeur: [40, 300],
  echappeeVisee: [170, 230],
});

const ENTIERS = new Set(['contremarches', 'avantPalier']);
const FACULTATIFS = new Set(['giron', 'contremarches', 'avantPalier', 'tremieLongueur', 'tremieLargeur']);

function borner(cle, valeur) {
  const [min, max] = BORNES[cle];
  const nombre = ENTIERS.has(cle) ? Math.round(valeur) : valeur;
  return Math.min(max, Math.max(min, nombre));
}

// Complète et corrige une configuration (valeurs manquantes, hors bornes ou inconnues).
export function normaliser(config = {}) {
  const sortie = { ...DEFAUTS };
  for (const cle of Object.keys(DEFAUTS)) {
    if (!(cle in config) || cle === 'v') continue;
    const valeur = config[cle];
    if (cle === 'forme') sortie.forme = FORMES.includes(valeur) ? valeur : DEFAUTS.forme;
    else if (cle === 'sens') sortie.sens = SENS.includes(valeur) ? valeur : DEFAUTS.sens;
    else if (cle === 'structure') sortie.structure = STRUCTURES.includes(valeur) ? valeur : DEFAUTS.structure;
    else if (cle === 'fermee') sortie.fermee = valeur === true || valeur === 1 || valeur === '1';
    else if (FACULTATIFS.has(cle) && (valeur === null || valeur === '' || valeur === undefined)) sortie[cle] = null;
    else {
      const nombre = typeof valeur === 'number' ? valeur : Number(valeur);
      sortie[cle] = Number.isFinite(nombre) ? borner(cle, nombre) : DEFAUTS[cle];
    }
  }
  return sortie;
}

// Lien de partage : seules les valeurs différentes des défauts, en JSON encodé base64url,
// dans l'ancre de l'adresse (#e=…), jamais envoyée au serveur.
export function encoder(config) {
  const propre = normaliser(config);
  const diff = { v: VERSION };
  for (const [cle, valeur] of Object.entries(propre)) {
    if (cle !== 'v' && valeur !== DEFAUTS[cle]) diff[cle] = valeur;
  }
  const json = JSON.stringify(diff);
  const base64 = typeof btoa === 'function' ? btoa(json) : Buffer.from(json, 'utf8').toString('base64');
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decoder(texte) {
  try {
    const base64 = String(texte).replaceAll('-', '+').replaceAll('_', '/');
    const json = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf8');
    const objet = JSON.parse(json);
    if (!objet || typeof objet !== 'object') return normaliser();
    return normaliser(objet);
  } catch {
    return normaliser();
  }
}
