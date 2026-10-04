// Calculateur : tissu mural (tenture) au mètre.
export default {
  slug: 'quantite-tenture-murale',
  titre: 'Calcul de tenture murale au mètre',
  rubrique: 'Tenture murale',
  lot: 'murs',
  ordre: 3,
  teinte: 'tenture',
  description: 'Dessinez la pièce et calculez le métrage de tissu mural à acheter, posé à l’horizontale en grande largeur ou en lés verticaux.',
  intro: 'Le périmètre vient de la pièce dessinée. Un tissu plus large que la hauteur du mur se pose à l’horizontale, en une seule bande autour de la pièce.',
  categorie: 'UtilitiesApplication',
  plan: true,

  champs: [
    { id: 'hauteur', lienPiece: 'hauteur', label: 'Hauteur sous plafond', unite: 'm', requis: true, min: 0.5, max: 6, defaut: 2.5 },
    { id: 'ouvertures', remplacePar: 'largeurPortesFenetres', label: 'Largeur des grandes ouvertures à déduire', unite: 'm', min: 0, defaut: 0 },
    {
      id: 'laize',
      type: 'choix',
      label: 'Largeur du tissu (laize)',
      defaut: 2.8,
      options: [
        { valeur: 2.8, libelle: '2,80 m, grande largeur posée à l’horizontale' },
        { valeur: 1.4, libelle: '1,40 m, posée en lés verticaux' },
        { valeur: 1.3, libelle: '1,30 m, posée en lés verticaux' },
      ],
    },
    {
      id: 'typeRaccord',
      type: 'choix',
      label: 'Type de raccord',
      defaut: 0,
      aide: 'Indiqué sur l’étiquette. Droit : le motif se prolonge à la même hauteur. Sauté : il est décalé d’un lé à l’autre.',
      options: [
        { valeur: 0, libelle: 'Libre (uni, sans motif)' },
        { valeur: 1, libelle: 'Droit' },
        { valeur: 2, libelle: 'Sauté (décalé)' },
      ],
    },
    { id: 'raccord', label: 'Hauteur du raccord', unite: 'cm', min: 0, max: 200, defaut: 0, aide: 'Utile en pose verticale ; en pose horizontale, la marge couvre les raccords aux angles.' },
    { id: 'marge', label: 'Marge', unite: '%', min: 0, max: 30, defaut: 5, aide: 'Pour les retours d’angle et l’ajustement.' },
    { id: 'prixMetre', label: 'Prix au mètre', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'metrage', label: 'Tissu à acheter', format: 'nombre', unite: 'm', principal: true },
    { id: 'pose', label: 'Lés verticaux (0 : pose horizontale en une bande)', format: 'nombre' },
    { id: 'metrageRaccord', label: 'Dont métrage dû au raccord', format: 'nombre', unite: 'm' },
    { id: 'surfaceMurs', label: 'Surface des murs', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    const longueurMurs = Math.max(0, plan.perimetre - v.ouvertures);
    const horizontale = v.laize >= v.hauteur + 0.1;
    if (!horizontale && v.typeRaccord > 0 && !(v.raccord > 0)) {
      return { erreur: 'Tissu à motif posé en lés : indiquez la hauteur du raccord, donnée par le fabricant.' };
    }
    const raccord = !horizontale && v.typeRaccord > 0 ? v.raccord / 100 : 0;
    // Horizontale : une bande qui fait le tour ; verticale : des lés de hauteur + 10 cm + raccord.
    const les = horizontale ? 0 : Math.ceil(longueurMurs / v.laize - 1e-9);
    const metrage = (supplement) => {
      const brut = horizontale ? longueurMurs : les * (v.hauteur + 0.1 + supplement);
      return Math.ceil(brut * (1 + v.marge / 100) * 10 - 1e-9) / 10;
    };
    return {
      surfaceMurs: longueurMurs * v.hauteur,
      pose: les,
      metrage: metrage(raccord),
      metrageRaccord: Math.round((metrage(raccord) - metrage(0)) * 100) / 100,
    };
  },

  devis: [
    { resultat: 'metrage', designation: 'Tenture murale', unite: 'm', prixChamp: 'prixMetre', detail: 'Laize de {laize} m, {surfaceMurs} m² de murs' },
  ],

  explication: `
        <p>Quand la largeur du tissu dépasse la hauteur du mur d’au moins 10 cm, il se pose à l’horizontale : il suffit d’une longueur égale au périmètre des murs, sans raccord vertical.</p>
        <p>Sinon, il se pose en lés verticaux comme un papier peint : nombre de lés = périmètre ÷ laize, chaque lé mesurant la hauteur plus 10 cm et le raccord de motif. Le métrage est arrondi aux 10 cm supérieurs.</p>`,

  erreurs: [
    'Oublier le raccord en pose verticale.',
    'Mélanger les sens de pose : le tissu n’a pas le même reflet dans les deux sens.',
    'Couper au ras du plafond et du sol sans surplus.',
  ],

  conseils: [
    'Préparez le mur comme pour un papier peint : sain, sec et plan.',
    'Laissez un surplus en haut et en bas, puis arasez une fois le tissu tendu.',
    'Utilisez la colle préconisée par le fabricant du tissu.',
  ],

  normes: [
    {
      titre: 'NF DTU 59.4',
      url: 'https://www.batirama.com/article/20820-dtu-59.4-mise-en-uvre-des-papiers-peints-et-des-revetements-muraux.html',
      description: 'mise en œuvre des papiers peints et revêtements muraux',
    },
  ],

  lies: ['quantite-papier-peint', 'quantite-peinture', 'quantite-parement'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Tenture collée ou tendue ?',
      reponse: 'Le tissu peut être collé directement sur le mur ou tendu sur des tasseaux, souvent avec un molleton en dessous pour l’isolation phonique. Le métrage de tissu est le même ; la pose tendue demande en plus des tasseaux et du molleton.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, ouvertures: 0, laize: 2.8, typeRaccord: 1, raccord: 0, marge: 5, prixMetre: 0 },
      attendu: { surfaceMurs: 35, pose: 0, metrage: 14.7, metrageRaccord: 0 },
    },
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, ouvertures: 0, laize: 1.4, typeRaccord: 0, raccord: 0, marge: 0, prixMetre: 0 },
      attendu: { pose: 10, metrage: 26 },
    },
    {
      // 10 lés verticaux, raccord droit de 32 cm : 10 × 2,92 m.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, ouvertures: 0, laize: 1.4, typeRaccord: 1, raccord: 32, marge: 0, prixMetre: 0 },
      attendu: { pose: 10, metrage: 29.2, metrageRaccord: 3.2 },
    },
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, ouvertures: 0, laize: 1.4, typeRaccord: 2, raccord: 0, marge: 0, prixMetre: 0 },
      attendu: {},
    },
  ],
};
