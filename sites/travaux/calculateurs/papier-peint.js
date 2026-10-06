// Calculateur : rouleaux de papier peint, en lés, avec raccord de motif.
export default {
  slug: 'quantite-papier-peint',
  titre: 'Calcul du nombre de rouleaux de papier peint',
  rubrique: 'Papier peint',
  lot: 'murs',
  ordre: 2,
  teinte: 'papierpeint',
  description: 'Dessinez la pièce et calculez le nombre de lés et de rouleaux de papier peint selon la hauteur, le format du rouleau et le raccord de motif.',
  intro: 'Le périmètre vient de la pièce dessinée. Le calcul compte les lés à poser, puis combien de lés entiers on tire de chaque rouleau. Il ne concerne pas les papiers peints panoramiques, vendus aux dimensions du mur.',
  categorie: 'UtilitiesApplication',
  plan: true,

  groupes: {
    'Dimensions des murs': 'Le périmètre vient de la pièce dessinée ci-dessus. Indiquez la hauteur à tapisser.',
    'Caractéristiques du papier peint': 'Retrouvez ces informations sur l’étiquette du rouleau ou la fiche produit. Les formats les plus courants sont déjà renseignés : modifiez-les si votre rouleau est différent.',
  },

  champs: [
    { id: 'hauteur', lienPiece: 'hauteur', groupe: 'Dimensions des murs', label: 'Hauteur à tapisser', unite: 'm', requis: true, min: 0.5, max: 6, defaut: 2.5 },
    { id: 'ouvertures', remplacePar: 'largeurPortesFenetres', groupe: 'Dimensions des murs', label: 'Largeur des grandes ouvertures à déduire', unite: 'm', min: 0, defaut: 0, aide: 'Baies vitrées, portes-fenêtres. Les portes et fenêtres courantes ne se déduisent pas : les chutes servent au-dessus et en dessous.' },
    {
      id: 'largeurRouleau',
      groupe: 'Caractéristiques du papier peint',
      type: 'choix',
      label: 'Largeur du rouleau',
      defaut: 0.53,
      options: [
        { valeur: 0.53, libelle: '0,53 m, format standard' },
        { valeur: 0.7, libelle: '0,70 m' },
        { valeur: 1.06, libelle: '1,06 m, grand format intissé' },
      ],
    },
    { id: 'longueurRouleau', groupe: 'Caractéristiques du papier peint', label: 'Longueur du rouleau', unite: 'm', requis: true, min: 1, defaut: 10.05 },
    {
      id: 'typeRaccord',
      groupe: 'Caractéristiques du papier peint',
      type: 'choix',
      label: 'Type de raccord',
      defaut: 0,
      aide: 'Indiqué par un pictogramme sur l’étiquette. Droit : le motif se prolonge à la même hauteur. Sauté : il est décalé d’un lé à l’autre.',
      options: [
        { valeur: 0, libelle: 'Libre (uni, sans motif)' },
        { valeur: 1, libelle: 'Droit' },
        { valeur: 2, libelle: 'Sauté (décalé)' },
      ],
    },
    { id: 'raccord', groupe: 'Caractéristiques du papier peint', label: 'Hauteur du raccord', unite: 'cm', min: 0, max: 120, defaut: 0, aide: 'Hauteur de répétition du motif, inscrite sur l’étiquette à côté du pictogramme (par exemple 53 ou 64 cm).' },
    { id: 'rouleauxParColle', avance: true, label: 'Rouleaux posés avec un paquet de colle', min: 1, defaut: 6, aide: 'Indiqué sur le paquet de colle.' },
    { id: 'prixRouleau', label: 'Prix d’un rouleau', unite: '€', min: 0 },
    { id: 'prixColle', label: 'Prix d’un paquet de colle', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'rouleaux', equivalent: { champ: 'longueurRouleau', unite: 'm' }, label: 'Rouleaux de papier peint', format: 'nombre', principal: true },
    { id: 'rouleauxRaccord', label: 'Dont rouleaux dus au raccord de motif', format: 'nombre' },
    { id: 'les', label: 'Lés à poser', format: 'nombre' },
    { id: 'longueurLe', cumul: false, label: 'Longueur à couper par lé', format: 'nombre', unite: 'm' },
    { id: 'lesParRouleau', cumul: false, label: 'Lés par rouleau', format: 'nombre' },
    { id: 'paquetsColle', label: 'Paquets de colle', format: 'nombre' },
  ],

  calculer(v, plan) {
    if (v.typeRaccord > 0 && !(v.raccord > 0)) {
      return { erreur: 'Papier à motif : indiquez la hauteur du raccord, inscrite sur l’étiquette du rouleau.' };
    }
    const raccord = v.typeRaccord > 0 ? v.raccord / 100 : 0;
    const les = Math.ceil(Math.max(0, plan.perimetre - v.ouvertures) / v.largeurRouleau - 1e-9);

    // Chaque lé mesure la hauteur, plus 10 cm de coupe, plus le raccord pour retrouver le motif.
    // Pour un raccord sauté, les lés alternent entre deux positions : on compte un raccord complet par lé, par prudence.
    function rouleauxPour(supplement) {
      const lesParRouleau = Math.floor(v.longueurRouleau / (v.hauteur + 0.1 + supplement) + 1e-9);
      return lesParRouleau < 1 ? null : { lesParRouleau, rouleaux: Math.ceil(les / lesParRouleau) };
    }
    const avecRaccord = rouleauxPour(raccord);
    const sansRaccord = rouleauxPour(0);
    if (!avecRaccord) {
      return { erreur: 'Le rouleau est trop court pour un seul lé à cette hauteur avec ce raccord.' };
    }
    return {
      les,
      longueurLe: Math.round((v.hauteur + 0.1 + raccord) * 100) / 100,
      lesParRouleau: avecRaccord.lesParRouleau,
      rouleaux: avecRaccord.rouleaux,
      rouleauxRaccord: avecRaccord.rouleaux - sansRaccord.rouleaux,
      paquetsColle: Math.ceil(avecRaccord.rouleaux / v.rouleauxParColle),
    };
  },

  devis: [
    { resultat: 'rouleaux', achat: 'papier-peint', designation: 'Papier peint', unite: 'rouleau', prixChamp: 'prixRouleau', detail: '{les} lés de {longueurLe} m, raccord {raccord} cm, {lesParRouleau} lés par rouleau' },
    { resultat: 'paquetsColle', designation: 'Colle à papier peint', unite: 'paquet', prixChamp: 'prixColle', complement: true },
  ],

  explication: `
        <p>Nombre de lés = périmètre des murs ÷ largeur du rouleau, arrondi au lé supérieur. Chaque lé mesure la hauteur sous plafond, plus 10 cm pour la coupe en haut et en bas, plus le raccord de motif.</p>
        <p>Un rouleau donne un nombre entier de lés : le reste est une chute. Rouleaux = lés ÷ lés par rouleau, arrondi au rouleau supérieur.</p>
        <p><strong>Attention aux motifs.</strong> Avec un raccord droit, le motif se prolonge à la même hauteur d’un lé à l’autre : chaque lé doit être coupé plus long, de la hauteur du raccord, pour retrouver le motif. Avec un raccord sauté, le motif est décalé d’un demi-raccord d’un lé à l’autre : en coupant les lés en alternance dans deux rouleaux on limite la chute, mais le calcul compte un raccord complet par lé pour ne jamais manquer de papier. Le résultat indique combien de rouleaux le raccord ajoute.</p>
        <p>Achetez tous les rouleaux en une fois et vérifiez qu’ils portent le même numéro de bain : les teintes varient d’une fabrication à l’autre.</p>`,

  erreurs: [
    'Ignorer le raccord du motif : chaque lé doit être décalé pour aligner le dessin, ce qui augmente la longueur à couper et le nombre de rouleaux.',
    'Acheter des rouleaux de bains différents : le numéro de bain est inscrit sur l’étiquette et la teinte peut varier.',
    'Utiliser une colle inadaptée : papier, vinyle et intissé ne demandent pas la même colle.',
    'Poser sur un support mal préparé : une peinture brillante ou un mur poudreux empêche l’adhérence.',
  ],

  conseils: [
    'Tracez une verticale au fil à plomb ou au niveau laser pour le premier lé ; les murs sont rarement d’aplomb.',
    'Commencez près d’une fenêtre et tournez dans le sens qui éloigne les raccords de la lumière.',
    'Avec l’intissé, encollez le mur et non le papier, selon la notice.',
    'Sur un plâtre neuf, appliquez d’abord une sous-couche : le papier se décollera plus facilement plus tard.',
    'Gardez un rouleau de réserve pour d’éventuelles réparations.',
  ],

  normes: [
    {
      titre: 'NF DTU 59.4',
      url: 'https://www.batirama.com/article/20820-dtu-59.4-mise-en-uvre-des-papiers-peints-et-des-revetements-muraux.html',
      description: 'mise en œuvre des papiers peints et revêtements muraux',
    },
  ],

  lies: ['quantite-peinture', 'quantite-tenture-murale', 'quantite-parement'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Qu’est-ce que le raccord de motif ?',
      reponse: 'C’est la hauteur à laquelle le motif se répète. Pour que le motif se prolonge d’un lé à l’autre, chaque lé est coupé plus long : plus le raccord est grand, plus il y a de chute et de rouleaux.',
    },
    {
      question: 'Et pour un papier peint panoramique ?',
      reponse: 'Un panoramique (ou fresque murale) ne se calcule pas en rouleaux : il est vendu aux dimensions du mur, en lés numérotés à poser dans l’ordre. Mesurez la largeur et la hauteur du mur, et commandez le panoramique à ces dimensions, avec quelques centimètres de marge.',
    },
    {
      question: 'Comment savoir si mon papier a un raccord droit ou sauté ?',
      reponse: 'Un pictogramme sur l’étiquette l’indique, avec la hauteur du raccord. Posez toujours le premier lé à l’aplomb et vérifiez l’alignement du motif avant d’encoller les suivants.',
    },
    {
      question: 'Faut-il encoller le mur ou le papier ?',
      reponse: 'Cela dépend du papier : un intissé se pose en encollant le mur, ce qui accélère la pose ; un papier traditionnel s’encolle au dos et doit détremper le temps indiqué. Le pictogramme de l’étiquette précise la méthode et la colle à utiliser.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, ouvertures: 0, largeurRouleau: 0.53, longueurRouleau: 10.05, typeRaccord: 0, raccord: 0, rouleauxParColle: 6, prixRouleau: 0, prixColle: 0 },
      attendu: { les: 27, lesParRouleau: 3, rouleaux: 9, rouleauxRaccord: 0, paquetsColle: 2 },
    },
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, ouvertures: 2, largeurRouleau: 0.53, longueurRouleau: 10.05, typeRaccord: 1, raccord: 64, rouleauxParColle: 6, prixRouleau: 0, prixColle: 0 },
      attendu: { les: 23, longueurLe: 3.24, lesParRouleau: 3, rouleaux: 8, rouleauxRaccord: 0, paquetsColle: 2 },
    },
    {
      // Hauteur 2,70 m : 3 lés par rouleau sans raccord, 2 seulement avec un raccord de 64 cm (lés de 3,44 m).
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.7, ouvertures: 0, largeurRouleau: 0.53, longueurRouleau: 10.05, typeRaccord: 2, raccord: 64, rouleauxParColle: 6, prixRouleau: 0, prixColle: 0 },
      attendu: { les: 27, longueurLe: 3.44, lesParRouleau: 2, rouleaux: 14, rouleauxRaccord: 5 },
    },
    {
      // Motif annoncé sans hauteur de raccord : le calcul demande l'information au lieu de sous-estimer.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, ouvertures: 0, largeurRouleau: 0.53, longueurRouleau: 10.05, typeRaccord: 1, raccord: 0, rouleauxParColle: 6, prixRouleau: 0, prixColle: 0 },
      attendu: {},
    },
    {
      // Seule la porte-fenêtre (1,20 m) se déduit ; la porte et la fenêtre restent tapissées autour.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      ouvertures: [
        { type: 'porte', cote: 0, largeur: 83, hauteur: 204, position: 0 },
        { type: 'porte-fenetre', cote: 2, largeur: 120, hauteur: 215, position: 100 },
      ],
      entrees: { hauteur: 2.5, ouvertures: 0, largeurRouleau: 0.53, longueurRouleau: 10.05, typeRaccord: 0, raccord: 0, rouleauxParColle: 6, prixRouleau: 0, prixColle: 0 },
      attendu: { les: 25, rouleaux: 9 },
    },
  ],
};
