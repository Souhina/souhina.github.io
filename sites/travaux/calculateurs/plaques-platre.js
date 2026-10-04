// Calculateur : plaques de plâtre, rails, montants et vis pour une cloison ou un doublage sur ossature métallique.
export default {
  slug: 'plaques-de-platre',
  titre: 'Calcul des plaques de plâtre, rails et montants',
  rubrique: 'Plâtrerie',
  lot: 'platrerie-isolation',
  teinte: 'platrerie',
  description: 'Calculez le nombre de plaques de plâtre, de rails, de montants et de vis pour une cloison ou un doublage sur ossature métallique.',
  intro: 'Indiquez la longueur et la hauteur du mur à monter : le calcul compte les plaques par lé de 1,20 m, les rails au sol et au plafond, et les montants selon l’entraxe.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités de matériaux pour une cloison ou un doublage non porteur. La hauteur maximale dépend du type de montants et de leur entraxe : vérifiez-la sur la fiche technique du fabricant (DTU 25.41).',

  // Aide au choix : règles classées par priorité (le feu, puis l'humidité, puis l'acoustique).
  aideAuChoix: {
    questions: [
      { id: 'humide', question: 'La pièce est-elle humide (salle de bains, cuisine, buanderie) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'acoustique', question: 'Faut-il atténuer les bruits (chambre, bureau, mur mitoyen) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'feu', question: 'Une résistance au feu est-elle demandée (garage, chaufferie, parties communes) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { feu: 'oui' }, alors: { typePlaque: { valeur: 3, raison: 'car une résistance au feu est demandée ; le degré exigé dépend du local et de la réglementation, à vérifier' } } },
      { si: { humide: 'oui' }, alors: { typePlaque: { valeur: 1, raison: 'car la pièce est humide ; il existe aussi des plaques à la fois hydrofuges et phoniques' } } },
      { si: { acoustique: 'oui' }, alors: { typePlaque: { valeur: 2, raison: 'pour atténuer les bruits' }, isolant: { valeur: 1, raison: 'car la laine minérale entre les montants fait l’essentiel de l’isolation acoustique' } } },
      { si: {}, alors: { typePlaque: { valeur: 0, raison: 'aucun besoin particulier' } } },
    ],
  },

  // Cloison ou doublage dessiné de face, ou dimensions saisies.
  plan: { nature: 'mur', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, suggestionChantier: 'longueurCloisons', label: 'Longueur du mur', unite: 'm', requis: true, min: 0.1, defaut: 4 },
    { id: 'hauteur', saisie: true, label: 'Hauteur sous plafond', unite: 'm', requis: true, min: 0.5, max: 6, defaut: 2.5 },
    {
      id: 'ouvrage',
      type: 'choix',
      label: 'Type d’ouvrage',
      defaut: 2,
      options: [
        { valeur: 2, libelle: 'Cloison : plaques sur les deux faces' },
        { valeur: 1, libelle: 'Doublage d’un mur : plaques sur une face' },
      ],
    },
    {
      id: 'peau',
      type: 'choix',
      label: 'Épaisseur de parement',
      defaut: 1,
      options: [
        { valeur: 1, libelle: 'Une plaque par face (simple peau)' },
        { valeur: 2, libelle: 'Deux plaques par face (double peau, meilleure isolation phonique)' },
      ],
    },
    {
      id: 'typePlaque',
      type: 'choix',
      label: 'Type de plaque',
      defaut: 0,
      aide: 'Même calcul pour tous les types ; le type est repris dans le récapitulatif.',
      options: [
        { valeur: 0, libelle: 'Standard' },
        { valeur: 1, libelle: 'Hydrofuge (pièces humides)' },
        { valeur: 2, libelle: 'Phonique' },
        { valeur: 3, libelle: 'Résistante au feu' },
        { valeur: 4, libelle: 'Haute dureté' },
      ],
    },
    {
      id: 'hauteurPlaque',
      type: 'choix',
      label: 'Longueur des plaques et des montants',
      defaut: 250,
      options: [
        { valeur: 250, libelle: '2,50 m' },
        { valeur: 260, libelle: '2,60 m' },
        { valeur: 270, libelle: '2,70 m' },
        { valeur: 280, libelle: '2,80 m' },
        { valeur: 300, libelle: '3,00 m' },
      ],
    },
    {
      id: 'entraxe',
      type: 'choix',
      label: 'Entraxe des montants',
      defaut: 60,
      options: [
        { valeur: 60, libelle: '60 cm, cas courant' },
        { valeur: 40, libelle: '40 cm, pièce humide ou carrelage sur la cloison' },
      ],
    },
    { id: 'ouvertures', saisie: true, label: 'Nombre de portes et fenêtres', min: 0, defaut: 0, aide: 'Chaque ouverture demande deux montants supplémentaires pour l’encadrer.' },
    { id: 'isolant', type: 'case', label: 'Prévoir un isolant acoustique entre les montants', defaut: false, aide: 'Laine minérale posée dans l’ossature : c’est elle qui fait l’essentiel de l’isolation acoustique d’une cloison.' },
    { id: 'anglesSortants', label: 'Nombre d’angles sortants', min: 0, max: 50, defaut: 0, aide: 'Chaque angle reçoit une cornière de protection sur toute sa hauteur.' },
    { id: 'marge', label: 'Marge pour les coupes et la casse', unite: '%', min: 0, max: 50, defaut: 5 },
    { id: 'longueurRail', label: 'Longueur d’un rail', unite: 'm', min: 0.5, defaut: 3 },
    { id: 'visParPlaque', label: 'Vis par plaque', min: 0, defaut: 25, aide: 'Indicatif : une vis tous les 30 cm au plus sur chaque montant. Vérifiez la fiche du fabricant.' },
    { id: 'enduitM2', avance: true, label: 'Enduit à joint par m² de parement', unite: 'kg', min: 0, defaut: 0.35, aide: 'Indiqué sur le sac ou le seau ; environ 0,3 à 0,4 kg par m².' },
    { id: 'poidsEnduit', avance: true, label: 'Poids d’un sac ou d’un seau d’enduit', unite: 'kg', min: 1, defaut: 25 },
    { id: 'longueurBande', avance: true, label: 'Longueur d’un rouleau de bande à joint', unite: 'm', min: 5, defaut: 75 },
    { id: 'prixPlaque', label: 'Prix d’une plaque', unite: '€', min: 0 },
    { id: 'prixIsolantM2', label: 'Prix de l’isolant au m²', unite: '€', min: 0 },
    { id: 'prixRail', label: 'Prix d’un rail', unite: '€', min: 0 },
    { id: 'prixMontant', label: 'Prix d’un montant', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'plaques', label: 'Plaques de plâtre de 1,20 m', format: 'nombre', principal: true },
    { id: 'montants', label: 'Montants', format: 'nombre' },
    { id: 'rails', label: 'Rails, sol et plafond', format: 'nombre' },
    { id: 'vis', label: 'Vis', format: 'nombre' },
    { id: 'surfaceIsolant', label: 'Isolant acoustique', format: 'nombre', unite: 'm²' },
    { id: 'bande', label: 'Bande à joint', format: 'nombre', unite: 'm' },
    { id: 'rouleauxBande', label: 'Rouleaux de bande à joint', format: 'nombre' },
    { id: 'sacsEnduit', equivalent: { champ: 'poidsEnduit', unite: 'kg' }, label: 'Sacs ou seaux d’enduit à joint', format: 'nombre' },
    { id: 'cornieres', label: 'Cornières d’angle (2,50 m)', format: 'nombre' },
    { id: 'surface', label: 'Surface du mur', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    // Dessin : face du mur vue de face (longueur et hauteur hors tout, ouvertures dessinées).
    const longueur = plan ? plan.longueur : v.longueur;
    const hauteur = plan ? plan.hauteur : v.hauteur;
    const hauteurCm = hauteur * 100;
    const ouvertures = plan ? plan.nombreElements : v.ouvertures;
    // Nombre de lés de 1,20 m sur la longueur, et de rangées si le mur dépasse la longueur des plaques.
    const les = Math.ceil(longueur / 1.2);
    const rangees = Math.ceil(hauteurCm / v.hauteurPlaque);
    const plaquesSansMarge = les * rangees * v.ouvrage * v.peau;
    const plaques = Math.ceil(plaquesSansMarge * (1 + v.marge / 100));

    // Montants : un tous les "entraxe" plus celui de l'extrémité, deux de plus par ouverture.
    const lignesDeMontants = Math.floor((longueur * 100) / v.entraxe) + 1 + 2 * ouvertures;
    const montants = lignesDeMontants * Math.ceil(hauteurCm / v.hauteurPlaque);

    // Joints de la plaque visible de chaque face : joints verticaux entre lés, horizontaux entre rangées.
    const joints = v.ouvrage * ((les - 1) * hauteur + (rangees - 1) * longueur) * 1.1;
    const surfaceParement = (plan ? plan.surface : longueur * hauteur) * v.ouvrage;

    return {
      surface: plan ? plan.surface : longueur * hauteur,
      plaques,
      montants,
      rails: Math.ceil((2 * longueur) / v.longueurRail),
      vis: plaquesSansMarge * v.visParPlaque,
      bande: Math.ceil(joints),
      rouleauxBande: joints > 0 ? Math.ceil(joints / v.longueurBande - 1e-9) : 0,
      sacsEnduit: v.enduitM2 > 0 ? Math.ceil((surfaceParement * v.enduitM2) / v.poidsEnduit - 1e-9) : 0,
      cornieres: Math.round(v.anglesSortants) * Math.ceil(hauteur / 2.5 - 1e-9),
      // Isolant : surface du mur plus 5 % pour les coupes.
      surfaceIsolant: v.isolant ? Math.ceil((plan ? plan.surface : longueur * hauteur) * 1.05 * 10 - 1e-9) / 10 : 0,
    };
  },

  devis: [
    { resultat: 'plaques', achat: 'plaques-platre', detail: 'Plaque {typePlaque:libelle}, mur de {longueur} m × {hauteur} m', designation: 'Plaques de plâtre', unite: 'plaque', prixChamp: 'prixPlaque' },
    { resultat: 'montants', detail: 'Entraxe {entraxe} cm, {ouvertures} ouverture(s)', designation: 'Montants métalliques', unite: 'montant', prixChamp: 'prixMontant' },
    { resultat: 'rails', detail: 'Sol et plafond, rails de {longueurRail} m', designation: 'Rails métalliques', unite: 'rail', prixChamp: 'prixRail' },
    { resultat: 'vis', detail: 'Environ {visParPlaque} vis par plaque', designation: 'Vis pour plaques de plâtre', unite: 'vis' },
    { resultat: 'rouleauxBande', designation: 'Bande à joint', unite: 'rouleau', complement: true, detail: '{bande} m de joints' },
    { resultat: 'sacsEnduit', designation: 'Enduit à joint', unite: 'sac', complement: true },
    { resultat: 'cornieres', designation: 'Cornières d’angle', unite: 'cornière', complement: true, detail: '{anglesSortants} angle(s) sortant(s)' },
    { resultat: 'surfaceIsolant', designation: 'Isolant acoustique (laine minérale)', unite: 'm²', prixChamp: 'prixIsolantM2', detail: 'Entre les montants, {longueur} × {hauteur} m' },
  ],

  explication: `
        <p>Les plaques de 1,20 m de large sont posées verticalement. Le nombre de lés est la longueur du mur divisée par 1,20 m, arrondie au lé supérieur. Si le mur est plus haut que les plaques, une seconde rangée est comptée : choisissez de préférence des plaques au moins aussi longues que la hauteur sous plafond.</p>
        <p>Plaques = lés × rangées × faces × plaques par face, plus la marge. Les portes et fenêtres ne réduisent pas le nombre de plaques : on découpe dans la plaque autour de l’ouverture.</p>
        <p>Les rails courent au sol et au plafond sur toute la longueur. Les montants sont placés à l’entraxe choisi, avec un montant d’extrémité et deux montants par ouverture.</p>
        <p>La bande à joint couvre les joints verticaux entre lés et, s’il y a deux rangées, le joint horizontal, sur chaque face ; l’enduit se compte au m² de parement. Chaque angle sortant reçoit une cornière métallique sur toute sa hauteur.</p>
        <p>Le calcul vaut pour un doublage sur ossature métallique. Un doublage collé ou sur fourrures demande d’autres accessoires.</p>`,

  erreurs: [
    'Choisir une plaque standard en pièce humide : salle de bains et cuisine demandent une plaque hydrofuge.',
    'Espacer les montants plus que ne l’autorise la fiche technique, ou dépasser la hauteur maximale de la cloison.',
    'Oublier les renforts derrière les éléments lourds : meuble suspendu, lavabo, radiateur ou chauffe-eau.',
    'Négliger bandes et enduit : ils assurent la solidité des joints et l’absence de fissures.',
  ],

  conseils: [
    'Croisez les joints de plaques d’une face à l’autre de la cloison, et entre deux couches quand il y a deux plaques par face.',
    'Laissez un léger jeu en pied de plaque pour éviter les remontées d’humidité.',
    'Posez l’isolant dans l’ossature avant de fermer la seconde face si la cloison doit être phonique.',
    'Utilisez des vis, des bandes et un enduit du même système que les plaques.',
  ],

  normes: [
    {
      titre: 'NF DTU 25.41',
      url: 'https://www.batirama.com/article/2262-nf-dtu-25.41-ouvrages-en-plaques-de-platre-plaques-a-faces-cartonnees.html',
      description: 'ouvrages en plaques de plâtre à faces cartonnées : cloisons, doublages et plafonds',
    },
  ],

  lies: ['quantite-laine-de-verre', 'plafond-suspendu', 'quantite-peinture', 'carrelage-mural'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Entraxe de 60 ou de 40 cm ?',
      reponse: 'L’entraxe de 60 cm convient à la plupart des cloisons. On le réduit à 40 cm pour poser du carrelage sur la cloison ou en pièce humide, selon les préconisations du fabricant.',
    },
    {
      question: 'Pourquoi choisir une double peau ?',
      reponse: 'Deux plaques par face améliorent l’isolation phonique et la résistance aux chocs, mais doublent le nombre de plaques et de vis.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 4, hauteur: 2.5, ouvrage: 2, peau: 1, typePlaque: 1, isolant: 1, prixIsolantM2: 0, anglesSortants: 1, enduitM2: 0.35, poidsEnduit: 25, longueurBande: 75, hauteurPlaque: 250, entraxe: 60, ouvertures: 1, marge: 5, longueurRail: 3, visParPlaque: 25, prixPlaque: 0, prixRail: 0, prixMontant: 0 },
      attendu: { surface: 10, plaques: 9, montants: 9, rails: 3, vis: 200, bande: 17, rouleauxBande: 1, sacsEnduit: 1, cornieres: 1, surfaceIsolant: 10.5 },
    },
    {
      entrees: { longueur: 3, hauteur: 2.7, ouvrage: 1, peau: 2, typePlaque: 0, isolant: 0, prixIsolantM2: 0, anglesSortants: 0, enduitM2: 0.35, poidsEnduit: 25, longueurBande: 75, hauteurPlaque: 250, entraxe: 40, ouvertures: 0, marge: 0, longueurRail: 3, visParPlaque: 25, prixPlaque: 0, prixRail: 0, prixMontant: 0 },
      attendu: { plaques: 12, montants: 16, rails: 2, vis: 300 },
    },
  ],
};
