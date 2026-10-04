// Calculateur : carreaux, cartons et colle, avec anticipation des coupes selon la forme réelle.
export default {
  slug: 'quantite-carrelage',
  titre: 'Calcul de carrelage avec découpes',
  rubrique: 'Carrelage',
  lot: 'sols',
  ordre: 3,
  teinte: 'carrelage',
  description: 'Dessinez la forme exacte de votre pièce et calculez le nombre de carreaux entiers, de coupes, de cartons et de sacs de colle.',
  intro: 'Le calculateur pose virtuellement chaque carreau sur votre plan pour compter les carreaux entiers et les coupes, selon le format et le type de pose.',
  categorie: 'UtilitiesApplication',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'lieu', question: 'Où posez-vous le carrelage ?', options: [{ valeur: 'interieur', libelle: 'À l’intérieur' }, { valeur: 'colle', libelle: 'Sur une terrasse, collé sur une dalle' }, { valeur: 'plots', libelle: 'Sur une terrasse, en dalles sur plots' }] },
      { id: 'grandFormat', question: 'Les carreaux mesurent-ils 60 cm ou plus de côté ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'support', question: 'Le support risque-t-il de bouger (plancher bois, ancien carrelage, chape fissurée) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'effet', question: 'Quel effet recherchez-vous ?', options: [{ valeur: 'droit', libelle: 'Classique, joints alignés' }, { valeur: 'decale', libelle: 'Décalé, effet parquet ou brique' }, { valeur: 'diagonale', libelle: 'En diagonale' }] },
    ],
    regles: [
      { si: { lieu: 'plots' }, alors: { support: { valeur: 1, raison: '' } } },
      { si: {}, alors: { support: { valeur: 0, raison: '' } } },
      { si: { grandFormat: 'oui' }, alors: { accessoires: { valeur: 2, raison: 'car elles limitent les désaffleurs entre grands carreaux' } } },
      { si: {}, alors: { accessoires: { valeur: 1, raison: '' } } },
      { si: { support: 'oui' }, alors: { natte: { valeur: 1, raison: 'car elle désolidarise le carrelage d’un support qui bouge ; vérifiez la compatibilité avec la colle' } } },
      { si: { effet: 'decale' }, alors: { pose: { valeur: 1, raison: 'pour un carreau long, le décalage d’un tiers limite les désaffleurs, voyez la notice' } } },
      { si: { effet: 'diagonale' }, alors: { pose: { valeur: 3, raison: 'cette pose produit davantage de chutes' } } },
      { si: {}, alors: { pose: { valeur: 0, raison: '' } } },
    ],
  },

  plan: true,

  champs: [
    { id: 'largeurCarreau', label: 'Largeur d’un carreau', unite: 'cm', requis: true, min: 1, defaut: 30 },
    { id: 'longueurCarreau', label: 'Longueur d’un carreau', unite: 'cm', requis: true, min: 1, defaut: 60 },
    { id: 'joint', label: 'Largeur des joints', unite: 'mm', min: 0, max: 20, defaut: 3 },
    {
      id: 'pose',
      type: 'choix',
      label: 'Type de pose',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Pose droite' },
        { valeur: 1, libelle: 'Pose décalée d’un demi-carreau' },
        { valeur: 2, libelle: 'Pose décalée d’un tiers de carreau' },
        { valeur: 3, libelle: 'Pose en diagonale' },
      ],
    },
    {
      id: 'motif',
      type: 'choix',
      label: 'Motif composé de plusieurs carreaux',
      defaut: 1,
      aide: 'Carreaux de ciment ou décors dont le dessin se forme en assemblant plusieurs carreaux : on achète des motifs complets.',
      options: [
        { valeur: 1, libelle: 'Aucun (carreau uni ou décor indépendant)' },
        { valeur: 4, libelle: 'Motif de 4 carreaux (2 × 2)' },
        { valeur: 9, libelle: 'Motif de 9 carreaux (3 × 3)' },
        { valeur: 16, libelle: 'Motif de 16 carreaux (4 × 4)' },
      ],
    },
    {
      id: 'support',
      type: 'choix',
      label: 'Mode de pose',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Collé sur chape ou dalle' },
        { valeur: 1, libelle: 'Dalles sur plots (terrasse extérieure)' },
      ],
    },
    {
      id: 'accessoires',
      type: 'choix',
      label: 'Accessoires de pose',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Aucun' },
        { valeur: 1, libelle: 'Croisillons' },
        { valeur: 2, libelle: 'Cales autonivelantes (grands formats)' },
      ],
    },
    { id: 'natte', type: 'case', label: 'Prévoir une natte de désolidarisation', defaut: false, aide: 'Sur un support fissuré, un plancher bois ou un plancher chauffant, selon la notice du fabricant.' },
    { id: 'carreauxParCarton', label: 'Carreaux par carton', requis: true, min: 1, defaut: 6, aide: 'Indiqué sur l’étiquette du carton.' },
    { id: 'marge', label: 'Marge pour la casse', unite: '%', min: 0, max: 50, defaut: 5, aide: 'Carreaux cassés à la coupe ou défectueux. Comptez davantage si vous débutez.' },
    { id: 'consommationColle', label: 'Consommation de colle', unite: 'kg par m²', min: 0, defaut: 5, aide: 'Indiquée sur le sac ; elle augmente avec la taille des carreaux.' },
    { id: 'poidsSac', label: 'Poids d’un sac de colle', unite: 'kg', min: 1, defaut: 25 },
    { id: 'epaisseurCarreau', label: 'Épaisseur des carreaux', unite: 'mm', min: 3, max: 30, defaut: 9, aide: 'Sert au calcul du joint.' },
    { id: 'poidsSacJoint', label: 'Poids d’un sac de joint', unite: 'kg', min: 1, defaut: 5 },
    { id: 'croisillonsParCarreau', avance: true, label: 'Croisillons par carreau', min: 0, defaut: 2, aide: 'Environ 1 en croix, jusqu’à 4 en T sur les côtés.' },
    { id: 'calesParCarreau', avance: true, label: 'Cales autonivelantes par carreau', min: 0, defaut: 3 },
    { id: 'accessoiresParSachet', avance: true, label: 'Pièces par sachet d’accessoires', min: 1, defaut: 100 },
    { id: 'surfaceNatte', avance: true, label: 'Surface d’un rouleau de natte', unite: 'm²', min: 1, defaut: 5 },
    { id: 'prixCarton', label: 'Prix d’un carton', unite: '€', min: 0 },
    { id: 'prixSac', label: 'Prix d’un sac de colle', unite: '€', min: 0 },
    { id: 'prixSacJoint', label: 'Prix d’un sac de joint', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'cartons', label: 'Cartons à acheter', format: 'nombre', principal: true },
    { id: 'carreauxAAcheter', label: 'Carreaux nécessaires, marge comprise', format: 'nombre' },
    { id: 'entiers', label: 'Carreaux posés entiers', format: 'nombre' },
    { id: 'coupes', label: 'Coupes à réaliser', format: 'nombre' },
    { id: 'motifs', label: 'Motifs complets', format: 'nombre' },
    { id: 'surface', label: 'Surface à carreler', format: 'nombre', unite: 'm²' },
    { id: 'sacsColle', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs de colle', format: 'nombre' },
    { id: 'plots', label: 'Plots de terrasse', format: 'nombre' },
    { id: 'sachetsAccessoires', label: 'Sachets de croisillons ou de cales', format: 'nombre' },
    { id: 'rouleauxNatte', label: 'Rouleaux de natte de désolidarisation', format: 'nombre' },
    { id: 'jointKg', label: 'Joint nécessaire', format: 'nombre', unite: 'kg' },
    { id: 'sacsJoint', equivalent: { champ: 'poidsSacJoint', unite: 'kg' }, label: 'Sacs de joint', format: 'nombre' },
  ],

  // geo.calepiner pose virtuellement les carreaux sur la forme (voir moteur/geometrie.js).
  calculer(v, plan, geo) {
    const poses = [
      { type: 'droite' },
      { type: 'decalee', decalage: 0.5 },
      { type: 'decalee', decalage: 1 / 3 },
      { type: 'diagonale' },
    ];
    const calepinage = geo.calepiner(plan.points, {
      largeur: v.largeurCarreau,
      longueur: v.longueurCarreau,
      joint: v.joint / 10,
      ...(poses[v.pose] ?? poses[0]),
    });
    if (!calepinage) return null;

    // Motif composé : on arrondit au motif complet supérieur (un motif de 4 carreaux s'achète par 4).
    const taillesMotif = v.motif > 1 ? v.motif : 1;
    const carreauxBruts = Math.ceil((calepinage.entiers + calepinage.carreauxPourCoupes) * (1 + v.marge / 100));
    const carreauxAAcheter = Math.ceil(carreauxBruts / taillesMotif - 1e-9) * taillesMotif;
    const colle = plan.surface * v.consommationColle;
    const longueurMm = v.longueurCarreau * 10;
    const largeurMm = v.largeurCarreau * 10;
    const jointM2 = ((longueurMm + largeurMm) / (longueurMm * largeurMm)) * v.joint * v.epaisseurCarreau * 1.6;
    const surPlots = v.support === 1;
    // Dalles sur plots : un plot à chaque croisement de joints, sur l'emprise de la forme.
    const xs = plan.points.map((point) => point[0]);
    const ys = plan.points.map((point) => point[1]);
    const colonnes = Math.ceil((Math.max(...xs) - Math.min(...xs)) / (v.largeurCarreau + v.joint / 10) - 1e-9);
    const rangees = Math.ceil((Math.max(...ys) - Math.min(...ys)) / (v.longueurCarreau + v.joint / 10) - 1e-9);
    const parCarreau = v.accessoires === 1 ? v.croisillonsParCarreau : v.accessoires === 2 ? v.calesParCarreau : 0;
    const accessoires = surPlots ? 0 : Math.ceil(carreauxAAcheter * parCarreau - 1e-9);

    return {
      plots: surPlots ? (colonnes + 1) * (rangees + 1) : null,
      sachetsAccessoires: accessoires > 0 ? Math.ceil(accessoires / v.accessoiresParSachet - 1e-9) : 0,
      rouleauxNatte: v.natte && !surPlots ? Math.ceil((plan.surface * 1.1) / v.surfaceNatte - 1e-9) : 0,
      surface: plan.surface,
      entiers: calepinage.entiers,
      coupes: calepinage.coupes,
      carreauxAAcheter,
      motifs: taillesMotif > 1 ? carreauxAAcheter / taillesMotif : null,
      cartons: Math.ceil(carreauxAAcheter / v.carreauxParCarton),
      sacsColle: !surPlots && v.consommationColle > 0 ? Math.ceil(colle / v.poidsSac) : null,
      // Joint (formule des fabricants) : kg/m² = (L + l) ÷ (L × l) × largeur du joint × épaisseur × 1,6 (mm).
      jointKg: !surPlots && v.joint > 0 ? Math.round(plan.surface * jointM2 * 1.1 * 10) / 10 : null,
      sacsJoint: !surPlots && v.joint > 0 ? Math.ceil((plan.surface * jointM2 * 1.1) / v.poidsSacJoint - 1e-9) : null,
    };
  },

  devis: [
    { resultat: 'cartons', achat: 'carrelage', detail: '{surface} m², carreaux {largeurCarreau} × {longueurCarreau} cm, {entiers} entiers et {coupes} coupes', designation: 'Carrelage', unite: 'carton', prixChamp: 'prixCarton' },
    { resultat: 'sacsJoint', complement: true, detail: '{jointKg} kg, joints de {joint} mm', designation: 'Joint de carrelage', unite: 'sac', prixChamp: 'prixSacJoint' },
    { resultat: 'sacsColle', detail: '{surface} m² à {consommationColle} kg par m², sacs de {poidsSac} kg', designation: 'Colle à carrelage', unite: 'sac', prixChamp: 'prixSac' },
    { resultat: 'plots', designation: 'Plots pour dalles', unite: 'plot', detail: 'Un plot à chaque croisement de joints' },
    { resultat: 'sachetsAccessoires', designation: 'Croisillons ou cales de nivellement', unite: 'sachet', complement: true, detail: '{accessoires:libelle}' },
    { resultat: 'rouleauxNatte', designation: 'Natte de désolidarisation', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>Les carreaux sont posés virtuellement sur la forme dessinée, en partant de l’angle haut gauche du plan, joints compris. Chaque carreau entièrement dans la pièce est compté entier ; chaque carreau à cheval sur un mur est une coupe.</p>
        <p>Une coupe qui utilise plus de la moitié d’un carreau consomme un carreau. Deux petites coupes peuvent être taillées dans le même carreau : c’est une estimation, car une chute n’est réutilisable que si sa forme convient.</p>
        <p>Le joint suit la formule des fabricants : (longueur + largeur) ÷ (longueur × largeur) × largeur du joint × épaisseur du carreau × 1,6, en millimètres, avec 10 % de marge. Des carreaux de 30 × 60 cm en 9 mm avec des joints de 3 mm demandent environ 0,2 kg par m².</p>
        <p><strong>Motifs composés.</strong> Quand le dessin se forme en assemblant 4, 9 ou 16 carreaux (carreaux de ciment, décors), le nombre de carreaux est arrondi au motif complet. Centrez alors le motif dans la pièce : les motifs coupés se répartissent de façon égale sur les bords, ce qui peut ajouter quelques coupes.</p>
        <p><strong>Dalles sur plots.</strong> En terrasse, les dalles épaisses se posent à sec sur des plots réglables, un à chaque croisement de joints : ni colle, ni joint. Le nombre de plots est calculé sur l’emprise de la forme dessinée.</p>
        <p>Un carreleur démarre souvent la pose depuis le centre de la pièce pour équilibrer les coupes : le nombre de coupes peut alors varier légèrement.</p>`,

  erreurs: [
    'Calculer à partir de la seule surface : les coupes en bordure et autour des formes atypiques font perdre des carreaux. Le calepinage du calculateur compte les coupes réelles.',
    'Garder la même marge pour une pose droite et une pose en diagonale ou en chevrons : les poses décalées produisent bien plus de chutes.',
    'Acheter le carrelage en plusieurs fois : le numéro de lot (nuance et calibre) peut changer d’un réassort à l’autre.',
    'Utiliser une colle inadaptée au format, au support ou à la pièce : grands carreaux, plancher chauffant et extérieur demandent une colle de classe supérieure.',
    'Poser sur un support qui n’est pas plan : les carreaux sonnent creux, se fissurent ou présentent des désaffleurs.',
  ],

  conseils: [
    'Commencez la pose depuis l’axe de la pièce ou depuis le mur le plus visible, pour que les coupes tombent dans les zones discrètes.',
    'Pour les grands carreaux, encollez à la fois le support et l’envers du carreau (double encollage), selon la fiche de la colle.',
    'Mélangez les carreaux de plusieurs cartons au fur et à mesure de la pose pour répartir les nuances.',
    'Respectez les joints de fractionnement et de périphérie, recouverts ensuite par les plinthes.',
    'Gardez un carton de réserve pour les réparations futures.',
  ],

  normes: [
    {
      titre: 'NF DTU 52.2',
      url: 'https://www.batirama.com/article/11424-nf-dtu-52.2-pose-collee-des-revetements-ceramiques-et-assimiles.html',
      description: 'pose collée des revêtements céramiques et assimilés, sols et murs',
    },
    {
      titre: 'NF DTU 52.1',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'revêtements de sol scellés, pour la pose sur mortier',
    },
  ],

  lies: ['chape-ragreage', 'carrelage-mural', 'quantite-plinthes', 'plancher-chauffant'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi la pose en diagonale demande-t-elle plus de carreaux ?',
      reponse: 'Tous les carreaux le long des murs sont coupés en biais, ce qui multiplie les coupes et les chutes.',
    },
    {
      question: 'Faut-il prévoir des carreaux en plus ?',
      reponse: 'Oui : la marge couvre la casse, et quelques carreaux du même lot de fabrication permettront une réparation future.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [300, 0], [300, 200], [0, 200]],
      entrees: { largeurCarreau: 30, longueurCarreau: 60, joint: 0, pose: 0, motif: 1, support: 0, accessoires: 0, natte: 0, croisillonsParCarreau: 2, calesParCarreau: 3, accessoiresParSachet: 100, surfaceNatte: 5, carreauxParCarton: 6, marge: 5, consommationColle: 5, poidsSac: 25, epaisseurCarreau: 9, poidsSacJoint: 5, prixCarton: 0, prixSac: 0, prixSacJoint: 0 },
      attendu: { surface: 6, entiers: 30, coupes: 10, carreauxAAcheter: 37, cartons: 7, sacsColle: 2, sacsJoint: null },
    },
    {
      // 12 m² en 30 × 60, joints de 3 mm, carreaux de 9 mm : 0,216 kg/m² × 12 m² × 1,1 = 2,9 kg.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { largeurCarreau: 30, longueurCarreau: 60, joint: 3, pose: 0, motif: 1, support: 0, accessoires: 0, natte: 0, croisillonsParCarreau: 2, calesParCarreau: 3, accessoiresParSachet: 100, surfaceNatte: 5, carreauxParCarton: 6, marge: 5, consommationColle: 5, poidsSac: 25, epaisseurCarreau: 9, poidsSacJoint: 5, prixCarton: 0, prixSac: 0, prixSacJoint: 0 },
      attendu: { surface: 12, jointKg: 2.9, sacsJoint: 1 },
    },
    {
      // 3 × 2 m en carreaux de ciment 20 × 20 : 150 carreaux, 158 avec 5 % de marge, arrondis à 160 (40 motifs de 4).
      plan: [[0, 0], [300, 0], [300, 200], [0, 200]],
      entrees: { largeurCarreau: 20, longueurCarreau: 20, joint: 0, pose: 0, motif: 4, support: 0, accessoires: 0, natte: 0, croisillonsParCarreau: 2, calesParCarreau: 3, accessoiresParSachet: 100, surfaceNatte: 5, carreauxParCarton: 12, marge: 5, consommationColle: 5, poidsSac: 25, epaisseurCarreau: 15, poidsSacJoint: 5, prixCarton: 0, prixSac: 0, prixSacJoint: 0 },
      attendu: { entiers: 150, coupes: 0, carreauxAAcheter: 160, motifs: 40, cartons: 14 },
    },
    {
      // Terrasse de 4 × 3 m en dalles de 60 × 60 cm sur plots, joints de 4 mm : 7 × 5 dalles, 8 × 6 plots.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { largeurCarreau: 60, longueurCarreau: 60, joint: 4, pose: 0, motif: 1, support: 1, accessoires: 1, natte: 1, croisillonsParCarreau: 2, calesParCarreau: 3, accessoiresParSachet: 100, surfaceNatte: 5, carreauxParCarton: 2, marge: 5, consommationColle: 5, poidsSac: 25, epaisseurCarreau: 20, poidsSacJoint: 5, prixCarton: 0, prixSac: 0, prixSacJoint: 0 },
      attendu: { plots: 48, sacsColle: null, sacsJoint: null, sachetsAccessoires: 0, rouleauxNatte: 0 },
    },
    {
      // 12 m² collés en 30 × 60 avec cales autonivelantes (3 par carreau) et natte de désolidarisation.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { largeurCarreau: 30, longueurCarreau: 60, joint: 3, pose: 0, motif: 1, support: 0, accessoires: 2, natte: 1, croisillonsParCarreau: 2, calesParCarreau: 3, accessoiresParSachet: 100, surfaceNatte: 5, carreauxParCarton: 6, marge: 5, consommationColle: 5, poidsSac: 25, epaisseurCarreau: 9, poidsSacJoint: 5, prixCarton: 0, prixSac: 0, prixSacJoint: 0 },
      attendu: { plots: null, rouleauxNatte: 3, carreauxAAcheter: 72, sachetsAccessoires: 3 },
    },
  ],
};
